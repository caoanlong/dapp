function Btn({ text, theme='blue', onClick }) {
    if (theme === 'blue') {
        return (
            <div 
                onClick={onClick}
                className={`w-full md:w-56 p-3 mb-4 shadow-md cursor-pointer text-center text-white bg-blue-500`}>
                { text }
            </div>
        )
    }
    if (theme === 'green') {
        return (
            <div 
                onClick={onClick}
                className={`w-full md:w-56 p-3 mb-4 shadow-md cursor-pointer text-center text-white bg-green-500`}>
                { text }
            </div>
        )
    }
    if (theme === 'black') {
        return (
            <div 
                onClick={onClick}
                className={`w-full md:w-56 p-3 mb-4 shadow-md cursor-pointer text-center text-white bg-black`}>
                { text }
            </div>
        )
    }
    return (
        <div 
            onClick={onClick}
            className={`w-full md:w-56 p-3 mb-4 shadow-md cursor-pointer text-center text-white bg-yellow-500`}>
            { text }
        </div>
    )
}

export default Btn