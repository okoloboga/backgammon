import { useState, useEffect } from 'react';
import { colyseusService } from '../../../services/colyseusService';
import RoomCard from './RoomCard';
import '../../../styles/RoomList.css';

// Список активных игровых комнат
const RoomList = () => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const connectAndListen = async () => {
      await colyseusService.connect();

      const unsubscribe = colyseusService.onRoomsChange(
        (allRooms) => {
          setRooms(allRooms);
        },
        (roomId, room) => {
          setRooms((prevRooms) => [...prevRooms, room]);
        },
        (roomId) => {
          setRooms((prevRooms) => prevRooms.filter((room) => room.roomId !== roomId));
        }
      );

      // Возвращаем функцию для очистки при размонтировании компонента
      return () => {
        unsubscribe();
        colyseusService.disconnect();
      };
    };

    const cleanupPromise = connectAndListen();

    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, []);

  const handleEnterRoom = (roomId) => {
    console.log(`Вход в комнату ${roomId}`);
    // Здесь будет логика входа в комнату Colyseus
    // Например: await colyseusService.joinRoom(roomId);
  };

  return (
    <div className="rooms-section">
      <div className="rooms-header">
        <h2 className="rooms-title">ACTIVE GAMES</h2>
        <span className="rooms-count">{rooms.length} available</span>
      </div>

      <div className="rooms-container">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <RoomCard
              key={room.roomId} // Используем roomId от Colyseus
              room={room} // Передаем весь объект комнаты
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
  );
};

export default RoomList;