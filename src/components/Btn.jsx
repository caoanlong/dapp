function Btn({ text, theme='blue', onClick }) {
    
    return (
        <div 
            onClick={onClick}
            className={`w-full md:w-56 p-3 mb-4 shadow-md cursor-pointer text-center text-white bg-${theme}-500`}>
            { text }
        </div>
    )
}

export default Btn