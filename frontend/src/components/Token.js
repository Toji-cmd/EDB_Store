
export default function TokenDisplay() {
    const tokenStr = localStorage.getItem('token')
    return(
        <div>
            {tokenStr? (tokenStr): "Token Not Found"}
        </div>
    );
}