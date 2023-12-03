import {useState} from "react";
import axios from 'axios';
import {useNavigate} from "react-router-dom";
import { useCookies } from 'react-cookie'

const AuthModal = ({setShowModal, isSignUp}) => {
    const [email, setEmail] = useState(null)
    const [password, setPassword] = useState(null)
    const [confirmPassword, setConfirmPassword] = useState(null)
    const [error, setError] = useState(null)
    const [ cookies, setCookie, removeCookie] = useCookies(null)

    let navigate = useNavigate()


    const handleClick = () => {
        setShowModal(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if(isSignUp && (password !== confirmPassword)) {
                setError("Las contraseñas deben coincidir")
                return
            }
            const response = await axios.post(`http://localhost:8000/${isSignUp ? 'signup' : 'login'}`,
                { email, password })


            setCookie('AuthToken', response.data.token)
            setCookie('UserId', response.data.userId)

            const success = response.status === 201

            if (success && isSignUp) navigate ("/onboarding")
            if (success && !isSignUp) navigate ("/dashboard")

            window.location.reload()

        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="auth-modal">
            <div className= "close-icon" onClick={handleClick}>⦻</div>
            <h2>{isSignUp ? "Crear Cuenta" : "Inciar Sesión"}</h2>
            <p> Al hacer clic en 'Iniciar sesión', aceptas nuestros términos. Conoce cómo procesamos tus datos en
                nuestra Política de Privacidad y Política de Cookies</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Email"
                    required={true}
                    onChange={(e) => setEmail(e.target.value)}

                />
                <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Contraseña"
                    required={true}
                    onChange={(e) => setPassword(e.target.value)}

                />
                {isSignUp && <input
                    type="password"
                    id="password-check"
                    name="password-check"
                    placeholder=" Confirmar Contraseña"
                    required={true}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />}
                <input className="secondary-button" type="submit"/>
                <p>{error}</p>
            </form>

            <hr/>
            <h2> DESCARGA LA APP</h2>

        </div>
    )
}
export default AuthModal