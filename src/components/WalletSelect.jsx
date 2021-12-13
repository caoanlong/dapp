import { BsX } from "react-icons/bs"
import { metaMask, walletConnect, bscWallet } from '../icons'
import { connectMetaMask, connectBinanceChainWallet } from '../config/utils'
import { setWeb3 } from '../config/service'
import { SET_CHAIN } from '../store/constants'
import { useDispatch } from "react-redux"

function WalletSelect({ setShow, onSuccess }) {
    const dispatch = useDispatch()

    return (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-40 flex justify-center items-center">
            <div className="w-5/6 md:w-96 rounded-lg bg-white p-3">
                <div className="flex">
                    <div className="flex-1 flex items-center text-xl font-bold">Connect a wallet</div>
                    <div 
                        className="w-10 h-10 flex justify-center items-center cursor-pointer" 
                        onClick={() => setShow(false)}>
                        <BsX className="text-3xl" />
                    </div>
                </div>
                <div className="pt-4">
                    <div 
                        onClick={async () => {
                            const web3 = await connectMetaMask()
                            if (web3) {
                                setWeb3(web3)
                                dispatch({ type: SET_CHAIN, payload: 'ethereum' })
                                onSuccess && onSuccess(web3)
                            }
                            setShow(false)
                        }}
                        className="flex items-center py-2 mt-3 rounded-lg bg-gray-200 border border-gray-300 cursor-pointer">
                        <div className="flex-1 text-lg pl-4">MetaMask</div>
                        <div className="w-14 h-10 flex items-center justify-center">
                            <img className="w-7 h-7" src={metaMask} alt="logo" />
                        </div>
                    </div>
                    <div 
                        onClick={async () => {
                            setShow(false)
                        }}
                        className="flex items-center py-2 mt-3 rounded-lg bg-gray-200 border border-gray-300 cursor-pointer">
                        <div className="flex-1 text-lg pl-4">WalletConnect</div>
                        <div className="w-14 h-10 flex items-center justify-center">
                            <img className="w-7 h-7" src={walletConnect} alt="logo" />
                        </div>
                    </div>
                    <div 
                        onClick={async () => {
                            const web3 = await connectBinanceChainWallet()
                            if (web3) {
                                setWeb3(web3)
                                dispatch({ type: SET_CHAIN, payload: 'BinanceChain' })
                                onSuccess && onSuccess(web3)
                            }
                            setShow(false)
                        }}
                        className="flex items-center py-2 mt-3 rounded-lg bg-gray-200 border border-gray-300 cursor-pointer">
                        <div className="flex-1 text-lg pl-4">BinanceChainWallet</div>
                        <div className="w-14 h-10 flex items-center justify-center">
                            <img className="w-7 h-7" src={bscWallet} alt="logo" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WalletSelect