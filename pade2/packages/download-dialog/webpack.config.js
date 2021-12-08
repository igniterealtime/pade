/* global __dirname, module, process */
const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist'), // Output path for generated bundles
        chunkFilename: '[id].js',
        filename: "download-dialog.js"
    },
    entry: path.resolve(__dirname, 'src/download-dialog.js'),
    devtool: 'source-map',
    module: {
        rules: [
        {
            test: /\.scss$/,
            use: [
                'style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: true
                    }
                },
                {
                    loader: 'sass-loader',
                    options: {
                        sourceMap: true
                    }
                }
            ]
        }, {
            test: /\.js$/,
            exclude: /(node_modules|spec|mockup)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [
                        ["@babel/preset-env", {
                            "targets": {
                                "browsers": [">1%", "not ie 11", "not op_mini all"]
                            }
                        }]
                    ],
                    plugins: [
                        '@babel/plugin-proposal-nullish-coalescing-operator',
                        '@babel/plugin-proposal-optional-chaining',
                        '@babel/plugin-syntax-dynamic-import'
                    ]
                }
            }
        }]
    }
}
