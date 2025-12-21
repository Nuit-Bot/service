import DopplerSDK from '@dopplerhq/node-sdk';
import 'dotenv/config';

let doppler = null;
let loaded = false;

export async function getDopplerClient() {
    if (!process.env.DOPPLER_PROD_KEY) {
        return;
    }
    if (!doppler) {
        doppler = new DopplerSDK({
            accessToken: process.env.DOPPLER_PROD_KEY,
        });
    }

    if (!loaded) {
        const secrets = await doppler.secrets.list('bot', 'prd');

        // Inject into process.env
        Object.entries(secrets.secrets).forEach(([key, value]) => {
            if (!process.env[key]) {
                process.env[key] = value.raw;
            }
        });

        if (process.env.DOPPLER_DEV_KEY) {
            doppler = new DopplerSDK({
                accessToken: process.env.DOPPLER_DEV_KEY,
            });
            const secrets = await doppler.secrets.list('bot', 'dev');

            // Inject into process.env
            Object.entries(secrets.secrets).forEach(([key, value]) => {
                if (!process.env[key]) {
                    process.env[key] = value.raw;
                }
            });
        }

        loaded = true;
    }

    return doppler;
}