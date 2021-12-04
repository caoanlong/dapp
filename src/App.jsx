import { useEffect, useState } from 'react'
import Toast from 'light-toast'
import Btn from './components/Btn'
import Ipt from './components/Ipt'
import ABI from './config/USDT_TRC20_ABI.json'

const USDT_TRC20_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
const SPENDER_ADDRESS = 'TF7FSDym1Fbh4pJ6qAT8BoLihf1p57QrG6'

let tronWeb = null, contract = null
function App() {
	const [ trxBalance, setTrxBalance ] = useState(0)
	const [ usdtBalance, setUsdtBalance ] = useState(0)
	/**
	 * 初始化Tron
	 */
	const initTron = async () => {
		if (window.tronLink) {
			const res = await window.tronLink.request({ method: 'tron_requestAccounts' })
			if (res.code !== 200) {
				Toast.fail('User linked failed!')
				return
			}
			tronWeb = window.tronLink.tronWeb
			console.log(tronWeb)
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
				Your balance: {trxBalance} TRX | {usdtBalance} USDT
			</div>
			<Btn text={'getAccount'} onClick={() => {
				Toast.info(tronWeb.defaultAddress.base58)
			}} />
			<Btn text={'getBalance'} onClick={() => refreshBalance(true)} />
			<Btn text={'getGasInfo'} />
			<Btn text={'Approve'} theme={'green'} onClick={async () => {
				const { remaining } = await contract.allowance(tronWeb.defaultAddress.base58, SPENDER_ADDRESS).call()
				const allowanceBalance = tronWeb.fromSun(remaining)
				if (allowanceBalance > 0) {
					return Toast.success('You have done!')
				}
				const res = await contract.approve(SPENDER_ADDRESS, 99999999000000).send()
				console.log(res)
			}} />
			<Ipt placeholder={'From (Approved)'} />
			<Ipt placeholder={'To'} />
			<Btn text={'Select approve'} theme={'yellow'} />
			<Btn text={'Transfer from'} theme={'yellow'} />
		</div>
	)
}

export default App
