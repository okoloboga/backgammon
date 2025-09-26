import { useState, useEffect } from 'react'
import { colyseusService } from '../../../services/colyseusService'
import RoomCard from './RoomCard'
import '../../../styles/RoomList.css'

import PropTypes from 'prop-types';

// Список активных игровых комнат
const RoomList = ({ onNavigateToGame }) => {
  const [rooms, setRooms] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Подключаемся к лобби
    const connectToLobby = async () => {
      try {
        await colyseusService.connect()
        setIsConnected(true)
        
        // Подписываемся на изменения комнат
        const unsubscribe = colyseusService.onRoomsChange(
          (roomsList) => {
            console.log('Received rooms list:', roomsList)
            setRooms(roomsList)
          },
          (room) => {
            console.log('Room added:', room)
            setRooms(prev => [...prev, room])
          },
          (room) => {
            console.log('Room updated:', room)
            setRooms(prev => prev.map(r => r.roomId === room.roomId ? room : r))
          },
          (roomId) => {
            console.log('Room removed:', roomId)
            setRooms(prev => prev.filter(r => r.roomId !== roomId))
          }
        )

        return unsubscribe
      } catch (error) {
        console.error('Failed to connect to lobby:', error)
        setIsConnected(false)
      }
    }

    const unsubscribe = connectToLobby()

    // Очистка при размонтировании
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
      colyseusService.disconnect()
    }
  }, [])

  const handleEnterRoom = (roomId) => {
    console.log(`Entering room ${roomId}`);
    if (onNavigateToGame) {
      onNavigateToGame(roomId);
    }
  }

  return (
    <div className="rooms-section">
      <div className="rooms-header">
        <h2 className="rooms-title">ACTIVE GAMES</h2>
        <span className="rooms-count">
          {isConnected ? `${rooms.length} available` : 'Connecting...'}
        </span>
      </div>

      <div className="rooms-container">
        {!isConnected ? (
          <div className="rooms-loading">
            <p>Connecting to game server...</p>
          </div>
        ) : rooms.length > 0 ? (
          rooms.map(room => (
            <RoomCard
              key={room.roomId}
              room={room}
              onEnter={handleEnterRoom}
            />
          ))
        ) : (
          <div className="no-rooms">
            <h3 className="no-rooms-title">No Active Games</h3>
            <p className="no-rooms-text">Create your own game or check back later</p>
          </div>
        )}
      </div>
    </div>
  )
}

RoomList.propTypes = {
  onNavigateToGame: PropTypes.func.isRequired,
};

export default RoomList