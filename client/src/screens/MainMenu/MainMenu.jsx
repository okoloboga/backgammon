import ProfileCard from './components/ProfileCard'
import ActionButtons from './components/ActionButtons'
import RoomList from './components/RoomList'
import '../../styles/MainMenu.css'

// Главное меню приложения
const MainMenu = () => {
  return (
    <div className="main-menu">
      <div className="container">
        <div className="menu-content">
          <ProfileCard />
          <ActionButtons />
          <RoomList />
        </div>
      </div>
    </div>
  )
}

export default MainMenu