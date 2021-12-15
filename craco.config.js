module.exports = {
    style: {
        postcss: {
            plugins: [
                require('tailwindcss'),
                require('autoprefixer'),
            ],
        },
    },
    webpack: {
        configure: (webpackConfig, { env, paths }) => {
            webpackConfig.output = {
                ...webpackConfig.output,
                publicPath: './'
            }
            return webpackConfig
        }
    }
}