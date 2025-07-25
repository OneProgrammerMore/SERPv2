
const prefixURL = process.env.REACT_APP_ROUTES_PREFIX
const addPrefix = (url) =>{
    return prefixURL + url;
}

export default addPrefix;