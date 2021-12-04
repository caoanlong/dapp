function Ipt({ placeholder='Input...' }) {
    return (
        <div className="w-full md:w-56 p-3 mb-4 bg-gray-200">
            <input 
                style={{ background: 'none' }} 
                className="outline-none w-full" 
                type="text" 
                placeholder={placeholder} 
            />
        </div>
    )
}

export default Ipt