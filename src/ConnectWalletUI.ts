import { ProgressDisplay } from "./ProgressDisplay";
import XelisWallet from "./XelisWallet";
import './wallet-ui.css';
import './basic-theme.css';

export interface UIOptions {
    theme: string,
    walletMainPageTitle: string;
    remoteConnectButtonText: string;
    localConnectButtonText: string;
    getWalletButtonText: string;
    mainCancelButtonText: string;
}
export class ConnectWalletUI extends EventTarget {
    // main wallet container from dapp
    walletContainer: HTMLElement;
    // panel for all wallet interaction created here.
    walletPanel: HTMLDivElement;
    // UI for user to connect to a local or remote wallet.
    // waiting window for local, qr for remote.
    walletConnectContainer: HTMLDivElement;

    xelisWallet: XelisWallet;
    walletConnectInfo: HTMLElement;
    walletConnectOptions: HTMLElement;
    qrCodeContainer: HTMLElement;
    popupMessageContainer: HTMLDivElement;
    errorUIContainer: HTMLDivElement;
    uiOptions: UIOptions;

    constructor(wallet: XelisWallet, walletContainer: HTMLElement, uiOptions: any = {}) {
        super();

        const _thisUI = this;


        let _uiOptions = uiOptions ?? {};

        this.uiOptions = {
            walletMainPageTitle: _uiOptions.walletMainPageTitle ?? "Connect a XELIS Wallet",
            remoteConnectButtonText: _uiOptions.remoteConnectButtonText ?? "Connect using QR Code",
            localConnectButtonText: _uiOptions.localConnectButtonText ?? "Connect Local Desktop Wallet",
            getWalletButtonText: _uiOptions.getWalletButtonText ?? "I need a wallet",
            mainCancelButtonText: _uiOptions.mainCancelButtonText ?? "Cancel",
            theme: _uiOptions.theme ?? "basic-theme"
        }

        this.xelisWallet = wallet;
        this.walletContainer = walletContainer;
        this.walletPanel = document.createElement('div') as HTMLDivElement;
        this.walletPanel.classList.add('wallet-panel');

        this.walletConnectContainer = document.createElement('div');
        this.walletConnectContainer.classList.add('wallet-connect-container');
        this.walletConnectContainer.innerHTML = `
            <div class="wallet-connect-title">${this.uiOptions.walletMainPageTitle}</div>
            <div class="wallet-connect-options">
                <button class="btn-wallet-connect-mobile">${this.uiOptions.remoteConnectButtonText}</button>
                <button class="btn-wallet-connect-local">${this.uiOptions.localConnectButtonText}</button>
            </div>
            <div class="wallet-connect-info">
                <button class="btn-get-wallet">${this.uiOptions.getWalletButtonText}</button>
            </div>
            <div class="qr-code-container" style="display:none"></div>
            <div class="wallet-main-cancel-container">
                <button class="btn-close-wallet">${this.uiOptions.mainCancelButtonText}</button>
                <button class="btn-cancel-mobile-request" style="display:none">Cancel</button>
            </div>
            <div class="connected-container" style="display:none">
                <!--table class="wallet-stats">
                    <tr>
                        <td>Address:</td>
                        <td class="wallet-address"></td>
                    </tr>
                    <tr>
                        <td>XEL balance:</td>
                        <td class="wallet-balance"></td>
                    </tr>
                </table-->
                <button class="btn-disconnect">Disconnect</button>
            </div>

        `;

        this.walletConnectOptions = this.walletConnectContainer.querySelector('.wallet-connect-options') as HTMLElement;
        this.walletConnectInfo = this.walletConnectContainer.querySelector(`.wallet-connect-info`) as HTMLElement;
        this.qrCodeContainer = this.walletConnectContainer.querySelector(`.qr-code-container`) as HTMLElement;

        this.walletPanel.appendChild(this.walletConnectContainer);

        this.popupMessageContainer = document.createElement('div') as HTMLDivElement;
        this.popupMessageContainer.classList.add('popup-message-mode');
        this.walletPanel.appendChild(this.popupMessageContainer);

        this.errorUIContainer = document.createElement('div') as HTMLDivElement;
        this.errorUIContainer.classList.add('error-ui-container');
        this.walletPanel.appendChild(this.errorUIContainer);

        this.walletContainer.appendChild(this.walletPanel);

        const getWalletBtn = this.walletConnectContainer.querySelector('.btn-get-wallet') as HTMLButtonElement;
        const connectLocalBtn = this.walletConnectContainer.querySelector('.btn-wallet-connect-local') as HTMLButtonElement;
        const connectMobileBtn = this.walletConnectContainer.querySelector('.btn-wallet-connect-mobile') as HTMLButtonElement;
        const walletMainCancelContainer = this.walletConnectContainer.querySelector('.wallet-main-cancel-container') as HTMLButtonElement;
        const walletCloseBtn = this.walletConnectContainer.querySelector('.btn-close-wallet') as HTMLButtonElement;
        const cancelMobileRequestBtn = this.walletConnectContainer.querySelector('.btn-cancel-mobile-request') as HTMLButtonElement;

        const connectedContainer = this.walletConnectContainer.querySelector('.connected-container') as HTMLDivElement;
        const disconnectBtn = this.walletConnectContainer.querySelector('.btn-disconnect') as HTMLButtonElement;
        // TODO: add these to display wallet data if displayWalletData is set.
        // const walletAddress = this.walletConnectContainer.querySelector('.wallet-address') as HTMLDivElement;
        // const walletBalance = this.walletConnectContainer.querySelector('.wallet-balance') as HTMLDivElement;


        getWalletBtn.addEventListener('click', () => {
            window.open('https://xelis.io/resources', '_blank');
        });

        connectMobileBtn.addEventListener('click', () => {
            this.walletConnectOptions.style.display = 'none';
            this.walletConnectInfo.style.display = 'none';
            walletCloseBtn.style.display = 'none';
            cancelMobileRequestBtn.style.display = 'block';

            this.walletConnectContainer.style.display = `flex`;
            this.qrCodeContainer.innerHTML = '';
            this.qrCodeContainer.style.display = `flex`;

            this.xelisWallet.connectRemoteWallet(this.walletPanel);
        });

        connectLocalBtn.addEventListener('click', () => {

            this.walletConnectOptions.style.display = 'none';
            this.walletConnectInfo.style.display = 'none';
            walletMainCancelContainer.style.display = 'none';

            this.popupMessageContainer.innerHTML = '';
            this.popupMessageContainer.style.display = 'flex';

            const upperMessage = `<div class="mode-title">CONNECT LOCAL WALLET</div>`;
            const lowerMessage = `<div>Please approve the request in your local wallet to continue.</div>`;

            new ProgressDisplay({ container: this.popupMessageContainer, upperMessage: upperMessage, lowerMessage: lowerMessage });

            const cancelBtn = document.createElement('button');
            cancelBtn.classList.add('btn-popup-message-cancel');
            cancelBtn.innerHTML = 'Cancel';
            cancelBtn.addEventListener('click', () => {
                this.endInProgressConnection()
                closeWalletUI();
            }, { once: true });

            this.popupMessageContainer.appendChild(cancelBtn);

            this.xelisWallet.connectLocalWallet(this.walletPanel);
        });

        walletCloseBtn.addEventListener('click', () => {
            this.endInProgressConnection();
            closeWalletUI();
        });

        cancelMobileRequestBtn.addEventListener('click', () => {
            this.endInProgressConnection();
            resetConnectUI();
        });

        disconnectBtn.addEventListener('click', () => {
            this.walletContainer.classList.remove('connected-wallet');
            resetConnectUI();
            const event = new CustomEvent("wallet-ui-will-disconnect", {});
            this.xelisWallet.dispatchEvent(event);
            if (this.xelisWallet.connected) {
                this.xelisWallet.wallet?.close();
            }
        });

        this.xelisWallet.addEventListener("wallet-ready", (_: Event) => {
            console.log(`[ConnectWalletUI] wallet-ready`);
            this.endInProgressConnection();

            const walletTitle = this.walletConnectContainer.querySelector('.wallet-connect-title') as HTMLDivElement;
            walletTitle.innerHTML = `${this.xelisWallet.walletConfig.appData.name} Connected!`;
            this.walletContainer.classList.add('connected-wallet');
            connectedContainer.style.display = '';

            walletMainCancelContainer.style.display = 'none';

        });

        this.xelisWallet.addEventListener("wallet-connect-error", (event: Event) => {
            const evt = event as CustomEvent;

            console.log(`[ConnectWalletUI] wallet-connect-error ${evt.detail}`);

            this.endInProgressConnection();

            this.errorUIContainer.style.display = '';
            this.errorUIContainer.innerHTML = `
                     <div class="error-ui-title">WALLET CONNECTION FAILED</div>
                        <div class="error-ui-message">Can't connect to wallet. Is the wallet open?</div>
                    `;

            const errorBtnsGroup = document.createElement('div');
            errorBtnsGroup.classList.add('error-btns-group');

            const returnBtn = document.createElement('button');
            returnBtn.classList.add('btn-return');
            returnBtn.innerHTML = 'Cancel';
            returnBtn.addEventListener('click', () => {
                closeWalletUI();
            }, { once: true });

            const retryBtn = document.createElement('button');
            retryBtn.classList.add('btn-retry');
            retryBtn.innerHTML = 'Retry';
            retryBtn.addEventListener('click', () => {
                resetConnectUI();
            }, { once: true });

            errorBtnsGroup.appendChild(returnBtn);
            errorBtnsGroup.appendChild(retryBtn);

            this.errorUIContainer.appendChild(errorBtnsGroup);
        });

        this.xelisWallet.addEventListener("wallet-disconnect", (_: Event) => {
            console.log(`[ConnectWalletUI] wallet-disconnect`);
            this.walletContainer.classList.remove('connected-wallet');
            const walletTitle = this.walletConnectContainer.querySelector('.wallet-connect-title') as HTMLDivElement;
            walletTitle.innerHTML = this.uiOptions.walletMainPageTitle;
        });

        function resetConnectUI() {
            connectedContainer.style.display = 'none';
            // walletAddress.innerHTML = '';
            // walletBalance.innerHTML = '';
            _thisUI.walletConnectOptions.style.display = 'flex';
            _thisUI.walletConnectInfo.style.display = 'block';
            walletMainCancelContainer.style.display = 'block';
            _thisUI.errorUIContainer.innerHTML = '';
            _thisUI.errorUIContainer.style.display = 'none';
            cancelMobileRequestBtn.style.display = 'none';
            walletCloseBtn.style.display = 'block';
        }

        function closeWalletUI() {
            resetConnectUI();
            const event = new CustomEvent("wallet-ui-did-close", { detail: "Wallet UI closed" });
            _thisUI.xelisWallet.dispatchEvent(event);
        }
    }

    endInProgressConnection() {
        this.qrCodeContainer.style.display = `none`;
        this.popupMessageContainer.style.display = 'none';
        this.popupMessageContainer.innerHTML = '';

        //todo: handle dapp cleanup or fire event
    }
}