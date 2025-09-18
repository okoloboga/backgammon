import { useState } from 'react'
import ProfileCard from './components/ProfileCard'
import ActionButtons from './components/ActionButtons'
import RoomList from './components/RoomList'
import TonConnectButton from './components/TonConnectButton'
import CreateRoomModal from './components/CreateRoomModal'
import '../../styles/MainMenu.css'

// Главное меню приложения
const MainMenu = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div className="main-menu">
      <div className={`container ${isModalOpen ? 'blur-background' : ''}`}>
        <div className="menu-content">
          {/* TonConnect кнопка над ProfileCard */}
          <div className="flex justify-center mb-4">
            <TonConnectButton />
          </div>
          <ProfileCard />
          <ActionButtons onCreateGame={handleOpenModal} />
          <RoomList />
        </div>
      </div>
      
      <CreateRoomModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </div>
  )
}

export default MainMenu