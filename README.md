# BitoPro Asset Worth Node for n8n

This n8n node uses your BitoPro account to:

1. Fetch your current balances.
2. Convert each balance to TWD.
3. Return a full breakdown of each asset’s TWD value plus the total.

## Installation (via Community Nodes)

1. Open n8n.
2. Navigate to **Settings** > **Community Nodes**.
3. In Install New Package, type or paste the exact package name for this node.
   * For example, if your package is published to npm as n8n-nodes-bitopro-asset-worth, you’d enter:

     ```
     n8n-nodes-bitopro-asset-worth
     ```

4. Click **Install**.
5. When prompted, confirm the installation. n8n will fetch the package from npm, install it, and add the node(s) to your node palette.

## Credential Setup

1. In n8n, go to **Settings** > **Credentials**.
2. Click **New**, then select **BitoPro API** (provided by this package).
3. Enter:
   * Email: The email address linked to your BitoPro account.
   * API Key: Your BitoPro API key (created in your BitoPro dashboard).
   * API Secret: Your BitoPro secret key.
4. Click **Save**.

### Where to Get Your BitoPro API Key

* Log in to your BitoPro account.
* Go to API Management, create a new key or edit an existing one.
* Make sure it has Read Balances permission.
* Copy your API Key and Secret for use in n8n.

## Using the BitoPro Asset Worth Node

1. Create a **New Workflow** or open an existing one.
2. In the **Nodes** panel, search for **BitoPro Asset Worth**. Drag it into your workflow.
3. Open the node’s settings, and under **Credentials**, select **BitoPro API** from the dropdown.
4. **Execute** the node. This will:
   * Fetch all balances from BitoPro (private endpoint).
   * Filter out assets with zero balances.
   * For each non-zero currency, retrieve the current TWD price from BitoPro’s public ticker endpoint.
   * Return a breakdown of each asset’s TWD value and a `total` field representing your portfolio in TWD.

## Sample Output

```json
{
  "assets": [
    { "currency": "BTC", "value": 100000.12 },
    { "currency": "ETH", "value": 51230.87 },
    { "currency": "TWD", "value": 12345.0 }
  ],
  "total": 163576.0
}
```

## Contributing
* Issues or Requests: Open an issue or submit a pull request.
* License: MIT.

