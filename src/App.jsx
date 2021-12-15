import { useEffect, useState } from 'react'
import Toast from 'light-toast'
import Btn from './components/Btn'
import Ipt from './components/Ipt'
import ABI from './config/USDT_TRC20_ABI.json'

// const USDT_TRC20_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
// const ODD_TRC20_ADDRESS = 'TCxpWv5zvRhSmNpRj94ugJUirXZokr2EJs'
const USDT_TRC20_ADDRESS = 'TBqWVvfeudAYtd8B1yhQgsBM4AffziNHtw'
const CREATE_ADDRESS = 'TDo8UciMD9dsTXCYfgxzfVCzeX3oFY8tZT'

let tronWeb = null, contract = null, decimals = 1

function App() {
	const [ address, setAddress ] = useState('')
	const [ trxBalance, setTrxBalance ] = useState(0)
	const [ usdtBalance, setUsdtBalance ] = useState(0)
	const [ bandwidth, setBandwidth ] = useState(0)
	const [ to, setTo ] = useState('')
	const [ amount, setAmount ] = useState('1')
	const [ isOwner, setIsOwner ] = useState(false)
	const [ mintNum, setMintNum ] = useState('')
	const [ hash, setHash ] = useState('')
	
	
	/**
	 * 初始化Tron
	 */
	const initTron = async () => {
		if (window.tronWeb) {
			tronWeb = window.tronWeb
			console.log(tronWeb)
			setAddress(tronWeb.defaultAddress.base58)
			contract = await tronWeb.contract(ABI, USDT_TRC20_ADDRESS)
			console.log(contract)
			const o = await contract.owner().call()
			if (o) {
				setIsOwner(tronWeb.address.fromHex(o) === tronWeb.defaultAddress.base58)
			}
			decimals = await contract.decimals().call()
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
		Toast.hide()
	}

	useEffect(() => {
		const tx_hash = localStorage.getItem('tx_hash')
		if (tx_hash) {
			setHash(tx_hash)
		}
		Toast.loading('Loading...')
		setTimeout(() => initTron(), 500)
	}, [])

	return (
		<div className="w-full flex flex-col items-center p-4">
			<h1 className="text-4xl text-red-500 text-center font-bold pt-4">TRON</h1>
			<div className="py-3 text-center text-sm text-gray-600">
				<div>Contract Address: <span className="text-black">{USDT_TRC20_ADDRESS}</span></div>
				<div>Address: <span className="text-blue-500">{address}</span></div>
				<div>Balance:  <span className="text-red-500 mx-2">{trxBalance} TRX</span>| <span className="text-green-500 ml-2">{usdtBalance} USDT</span></div>
				<div>Bandwidth: <span className="text-yellow-500">{bandwidth}/1500</span></div>
			</div>
			<Btn text={'Refresh'} onClick={() => refresh(true)} />
			<Ipt 
				placeholder={'To'} 
				value={to} 
				onChange={(e) => {
					setTo(e.target.value)
				}}
			/>
			<Ipt 
				placeholder={'Amount'} 
				value={amount} 
				onChange={(e) => {
					setAmount(e.target.value)
				}}
			/>
			<Btn 
				text={'Transfer'} 
				theme={'yellow'} 
				onClick={async () => {
					if (!to.trim()) {
						Toast.fail('To address is required!')
						return
					}
					if (!tronWeb.isAddress(to.trim())) {
						Toast.fail('To address is invalid!')
						return
					}
					if (!amount.trim()) {
						Toast.fail('Amount is required!')
						return
					}
					const tx_hash = await contract.transfer(to, +amount * Math.pow(10, decimals)).send({
						feeLimit: 10000000
					})
					console.log(tx_hash)
					setHash(tx_hash)
					localStorage.setItem('tx_hash', tx_hash)
					setTimeout(() => {
						refresh()
					}, 3000)
					
				}}
			/>
			{
				isOwner ? 
				<>
				<Btn 
					text={'Mint'} 
					theme={'black'} 
					onClick={async () => {
						if (!mintNum.trim()) {
							Toast.fail('Mint num is required!')
							return
						}
						const tx_hash = await contract.issue(mintNum * Math.pow(10, decimals)).send()
						console.log(tx_hash)
						setHash(tx_hash)
						localStorage.setItem('tx_hash', tx_hash)
						setTimeout(() => {
							refresh()
						}, 3000)
					}} 
				/>
				<Ipt 
					placeholder={'Mint num'} 
					value={mintNum} 
					onChange={(e) => {
						setMintNum(e.target.value)
					}}
				/></> : <></>
			}
			{
				hash ? 
				<div className="w-full text-center p-4 overflow-hidden break-all">
					<a 
						className="text-blue-500 cursor-pointer" 
						target="_blank"
						href={`https://shasta.tronscan.io/#/transaction/${hash}`}>
						点击查询：{hash}
					</a>
				</div> : <></>
			}
			
		</div>
	)
}

export default App
