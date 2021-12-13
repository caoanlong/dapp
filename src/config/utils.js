import Web3 from 'web3'
import Toast from 'light-toast'

export const formatBalance = (balance, num=6) => {
    balance = Number(balance)
    return parseFloat(balance.toFixed(num))
}

export const connectMetaMask = async () => {
    if (window.ethereum) {
        window.ethereum.on('connect', (error) => {
            console.log(error)
        })
        window.ethereum.on('disconnect', (error) => {
            console.log(error)
            sessionStorage.removeItem('connected')
        })
        const account = (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0]
        console.log(account)
        const web3 = new Web3(window.ethereum)
        // await web3.currentProvider.enable()
        sessionStorage.setItem('connected', '1')
        return web3
    } else {
        Toast.fail('Ethereum not found!')
    }
}

export const connectBinanceChainWallet = async () => {
    if (window.BinanceChain) {
        const web3 = new Web3(window.BinanceChain)
        await web3.currentProvider.enable()
        sessionStorage.setItem('connected', '1')
        window.ethereum.on('disconnect', (error) => {
            console.log(error)
            sessionStorage.removeItem('connected')
        })
        return web3
    } else {
        Toast.fail('BinanceChain not found!')
    }
}