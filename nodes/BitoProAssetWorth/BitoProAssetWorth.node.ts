import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, IHttpRequestOptions } from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import * as crypto from 'crypto';
import { Buffer } from 'buffer';

export class BitoProAssetWorth implements INodeType {
		static BASE_URL: string = 'https://api.bitopro.com/v3';

    description: INodeTypeDescription = {
        displayName: 'BitoPro Asset Worth',
        name: 'bitoProAssetWorth',
        icon: 'file:bitopro.svg',
        group: ['transform'],
        version: 1,
        description: 'Retrieve total asset worth from BitoPro in TWD',
        defaults: {
            name: 'BitoPro Asset Worth',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'bitoproApi',
                required: true,
            },
        ],
        properties: [
            // No additional input properties for this node
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        // Get credentials
        const credentials = await this.getCredentials('bitoproApi');
        const email = credentials.email as string;
        const apiKey = credentials.apiKey as string;
        const secretKey = credentials.secretKey as string;

        // Prepare payload for GET authentication: { identity: email, nonce: timestamp }
        const nonce = Date.now();
        const payloadObj = { identity: email, nonce };
        const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64');

        // Create HMAC SHA384 signature of the payload using the API secret
        const signature = crypto.createHmac('sha384', secretKey).update(payload).digest('hex');

        // Set authentication headers
        const headers = {
            'X-BITOPRO-APIKEY': apiKey,
            'X-BITOPRO-PAYLOAD': payload,
            'X-BITOPRO-SIGNATURE': signature,
        };

        // 1. Fetch account balances from BitoPro
        let balanceResponse;
        const options: IHttpRequestOptions = {
            method: 'GET',
            url: `${BitoProAssetWorth.BASE_URL}/accounts/balance`,
            headers,
            json: true,
        };
        try {
            balanceResponse = await this.helpers.httpRequest(options);
        } catch (error) {
            // Throw a formatted error if the API request fails
            throw new NodeApiError(this.getNode(), error);
        }

        // The response is expected to have a structure { data: [ {currency, amount, ...}, ... ] }
        const balances = balanceResponse.data as Array<{ currency: string; amount: string; [key: string]: any }>;
        if (!balances) {
            throw new NodeApiError(this.getNode(), { message: 'Unexpected response format: no balance data' });
        }

        // 2. Filter out currencies with zero total amount
        const nonZeroBalances = balances.filter(item => parseFloat(item.amount) > 0);

        // 3. Fetch current TWD price for each asset and calculate total value
        const assetValues: Array<{ currency: string; value: number }> = [];
        let totalValue = 0;

        for (const asset of nonZeroBalances) {
            const currency = asset.currency.toLowerCase();
            let assetTwdValue: number;

            if (currency === 'twd') {
                // If the asset is TWD (fiat), its value in TWD is just the amount
                assetTwdValue = parseFloat(asset.amount);
            } else {
                // Fetch ticker for {currency}_twd to get lastPrice in TWD
                const pair = `${currency}_twd`;
                let tickerData;
                try {
										const tickerResponse = await this.helpers.httpRequest({
											method: 'GET',
											url: `${BitoProAssetWorth.BASE_URL}/tickers/${pair}`,
											json: true,
										});
                    // The ticker endpoint returns an object with a `data` field.
                    // If a specific pair is requested, `data` may be either a single object or an array containing one object.
                    if (tickerResponse.data) {
                        tickerData = Array.isArray(tickerResponse.data) ? tickerResponse.data[0] : tickerResponse.data;
                    } else {
                        // In case the API returns the data at root (unlikely), handle that
                        tickerData = tickerResponse;
                    }
                } catch (error) {
                    throw new NodeApiError(this.getNode(), error, { message: `Failed to fetch price for ${pair}` });
                }
                if (!tickerData || !tickerData.lastPrice) {
                    throw new NodeApiError(this.getNode(),  { message: `No ticker data for pair ${currency}_twd` });
                }
                const priceTWD = parseFloat(tickerData.lastPrice);
                const amount = parseFloat(asset.amount);
                assetTwdValue = priceTWD * amount;
            }

            // Accumulate the results
            totalValue += assetTwdValue;
            assetValues.push({ currency: asset.currency, value: assetTwdValue });
        }

        // 4. Prepare output JSON with asset values and total portfolio value
        const result = {
            assets: assetValues,
            total: totalValue,
        };

        // Return the result as a single item
        return [[{ json: result }]];
    }
}
