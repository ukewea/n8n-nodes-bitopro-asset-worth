import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class BitoProApi implements ICredentialType {
    name = 'bitoproApi';
    displayName = 'BitoPro API';
		icon = 'file:bitopro.svg' as const;
    documentationUrl = 'https://developer.bitopro.com';
    properties: INodeProperties[] = [
        {
            displayName: 'Email',
            name: 'email',
            type: 'string',
            default: '',
            description: 'Account email associated with the BitoPro API key',
            required: true,
        },
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
						typeOptions: {
							password: true,
						},
            default: '',
            description: 'BitoPro API Key',
            required: true,
        },
        {
            displayName: 'API Secret',
            name: 'secretKey',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            description: 'BitoPro API Secret (will be used to sign requests)',
            required: true,
        },
    ];
}
