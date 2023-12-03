import whiteLogo from '../images/unmatchladoblanco.png'
import colorLogo from '../images/unmatchlado.png'
const Nav = ({ authToken,minimal, setShowModal, showModal, setIsSignUp}) => {
    const handleClick = () => {
        setShowModal(true);
        setIsSignUp(false);
    };
    return (
        <nav>
            <div className="logo-container">
                <img
                    className={`logo ${minimal ? 'color-logo' : 'white-logo'}`}
                    src={minimal ? colorLogo : whiteLogo}
                    alt="logo"
                />
            </div>

            {!authToken && !minimal && (
                <button
                className="nav-button"
                onClick={handleClick}
                disabled={showModal}
                >
             Iniciar Sesión
                </button>
                )}
        </nav>
    );
};
export default Nav