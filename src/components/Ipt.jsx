function Ipt({ placeholder='Input...', value, onChange }) {
    return (
        <div className="w-full md:w-56 p-3 mb-4 bg-gray-200">
            <input 
                style={{ background: 'none' }} 
                className="outline-none w-full" 
                type="text" 
                value={value}
                placeholder={placeholder} 
                onChange={onChange}
            />
        </div>
    )
}

export default Ipt