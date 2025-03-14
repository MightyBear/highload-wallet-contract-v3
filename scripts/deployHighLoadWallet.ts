import { toNano, Address } from '@ton/core';
import { HighloadWalletV3 } from '../wrappers/HighloadWalletV3';
import { compile, NetworkProvider } from '@ton/blueprint';
import { mnemonicToWalletKey } from '@ton/crypto';

export async function run(provider: NetworkProvider) {
    const isTestnet = provider.network() == 'testnet';
    console.log(`Using ${isTestnet ? 'testnet' : 'mainnet'} network`);

    // Get sender address to use as admin wallet
    const sender = provider.sender();
    if (!sender.address) {
        throw new Error('Sender address is required');
    }

    const walletMnemonicArray = 'GET FROM SECRETS MANAGER'.split(' ');
    const walletKeyPair = await mnemonicToWalletKey(walletMnemonicArray); // extract private and public keys from mnemonic

    const config = HighloadWalletV3.createFromConfig(
        {
            publicKey: walletKeyPair.publicKey,
            subwalletId: 0x10ad,
            timeout: 60 * 60, // 1 hour
        },
        await compile('HighloadWalletV3'),
    );

    const wallet = provider.open(config);

    console.log('Deploying Wallet contract to:', wallet.address.toString());
    await wallet.sendDeploy(provider.sender(), toNano('0.05'));

    console.log('Waiting for deployment...');
    await provider.waitForDeploy(wallet.address);

    console.log('Wallet contract successfully deployed!');
    console.log('Contract address:', wallet.address.toString());
}
