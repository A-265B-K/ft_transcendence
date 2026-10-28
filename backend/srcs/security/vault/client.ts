import { readFileSync } from 'node:fs';

const vaultAddress = process.env.VAULT_ADDR ?? 'http://vault:8200';
const vaultTokenFile =
    process.env.VAULT_TOKEN_FILE ?? '/run/secrets/backend_vault_token';

let vaultToken: string;

try {
    vaultToken = readFileSync(vaultTokenFile, 'utf8').trim();
} catch {
    throw new Error(`Unable to read Vault token file: ${vaultTokenFile}`);
}

if (!vaultToken) {
    throw new Error('Vault token file is empty');
}

export type PostgresCredentials = {
    username: string;
    password: string;
    database: string;
};

export async function getPostgresCredentials(): Promise<PostgresCredentials> {
    const response = await fetch(`${vaultAddress}/v1/app/data/postgres-app`, {
        headers: {
            'X-Vault-Token': vaultToken
        }
    });

    if (!response.ok) {
        throw new Error(
            `Vault request failed: ${response.status} ${response.statusText}`
        );
    }

    const body = (await response.json()) as {
        data?: {
            data?: Record<string, unknown>;
        };
    };

    const credentials = body.data?.data;

    if (!credentials) {
        throw new Error('Vault returned no PostgreSQL credentials');
    }

    const { username, password, database } = credentials;

    if (
        typeof username != 'string' ||
        typeof password != 'string' ||
        typeof database != 'string'
    ) {
        throw new Error('Vault PostgreSQL credentials are incomplete');
    }

    return {
        username,
        password,
        database
    };
}

export type EmailCredentials = {
    username: string;
    password: string;
};

export async function getEmailCredentials(): Promise<EmailCredentials> {
    const response = await fetch(`${vaultAddress}/v1/app/data/email`, {
        headers: {
            'X-Vault-Token': vaultToken
        }
    });

    if (!response.ok) {
        throw new Error(
            `Vault request failed: ${response.status} ${response.statusText}`
        );
    }

    const body = (await response.json()) as {
        data?: {
            data?: Record<string, unknown>;
        };
    };

    const credentials = body.data?.data;

    if (!credentials) {
        throw new Error('Vault returned no email credentials');
    }

    const { username, password } = credentials;

    if (typeof username != 'string' || typeof password != 'string') {
        throw new Error('Vault PostgreSQL credentials are incomplete');
    }

    return {
        username,
        password
    };
}
