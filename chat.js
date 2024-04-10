import React, { useState, useEffect, useContext, useRef } from 'react';

import moment from 'moment'
import EmojiPicker from 'emoji-picker-react';
import Select, { components } from "react-select";
import Scrollbars from 'react-custom-scrollbars-2';
import AvatarImg from '../../assets/images/avatar.png';
import { InputGroup, Form, Button } from 'react-bootstrap';
import { AddIcon, PaperBoatIcon, PreviousArrow, SearchIcon } from '../Icons';

import './Chat.scss';
import * as cs from '../../Api/cs';
import useHeader from '../../Helper/useHeader';
import { SocketContext } from '../../Context/socket';
import UserImg from '../../../src/assets/images/user.png';
import ChatPlaceholder from '../../assets/images/chat-placeholder.png';


const Option = (props) => {

    return (
        <div className='add-user-list'>
            <div className='add-user-img'><img src={ChatPlaceholder} alt='' /></div>
            <div className='add-user-name'><components.Option {...props} /></div>
        </div>
    );
};


const Chat = (props) => {
    //Props Variable ...
    const { userId, showChat, setShowChat } = props;

    //State Variables ...
    const [isChat, setIsChat] = useState(false);
    const [userData, setUserData] = useState([])
    const [addUser, setAddUser] = useState(false);
    const [searchText, setSearchText] = useState();
    const [filterData, setFilterData] = useState()
    const [isWindow, setIsWindow] = useState(false);
    const [userDetails, setUserDetails] = useState()
    const [filterChat, setFilterChat] = useState([])
    const [chatMessage, setChatMessage] = useState();
    const [showEmoji, setShowEmoji] = useState(false)
    const [chatHistory, setChatHistory] = useState([]);
    const [userDataList, setUserDataList] = useState()
    const [allUsersData, setAllUserData] = useState([])
    const [activeChatUser, setActiveChatUser] = useState();
    
    
    const headers = useHeader()
    const bottomRef = useRef(null);
    const socket = useContext(SocketContext)


    //Handle Present Chat ...
    const handleChat = (activeUser) => {
        setFilterChat([])
        setChatHistory([])
        setAddUser(false)
        setActiveChatUser(activeUser)
        setIsChat(true);
        if (activeUser._id) {
            getChatMessagesList(activeUser._id);
        }
        trackReadMessage(activeUser?._id, activeUser?.lastMessageBy)
    }



   // Handle New Chat ...
    const handleNewChat = (activeUser) => {
        setFilterChat([])
        setChatHistory([])
        setAddUser(false)
        setActiveChatUser(activeUser)
        setIsChat(true);
        if (activeUser.receiver_id) {
            const checkRoomExists = userData?.find(item => item.participants.includes(activeUser.receiver_id));
            if (checkRoomExists) {
                getChatMessagesList(checkRoomExists._id);
            }
        }

    }

    //Handle Chat,s Back Button ...
    const handelBackButton = async () => {
        await fetchRooms()
        setIsChat(false);
    }

    //Handle Add New User ...
    const handleAddUser = () => {
        setAddUser(!addUser)
    }


    const handleAddActive = () => {
        if (addUser) setAddUser(false)
    }

    const handleHideChat = () => {
        setShowChat(false)
    }



    /**
     * Get Chat History Function ...
     */

    const getChatMessagesList = async (room_Id) => {

        try {
            const response = await cs.get(`getList/${room_Id}`, 'chatMessage', {}, headers);
            if (response?.data?.code === 200) {
                setChatHistory(response?.data?.data)
                setFilterChat(response?.data?.data)
            }
        }
        catch (error) {
            console.log(error)
        }

    }


    /**
     * Get User Details ...
     */

    const getUsersDetails = async () => {
        try {
            const response = await cs.get(`getUserList/${userId}`, 'users', {}, headers);
            if (response?.data?.code === 200) {
                setUserDetails(response?.data?.data)
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getUsersDetails()
    }, [])


    /**
     * Socket to Handle Live and Offline ...
     */

    useEffect(() => {
        let data = {
            id: userId,
            status: showChat,
        }

        socket.emit('live', data);

        trackReadMessage(activeChatUser?._id, activeChatUser?.lastMessageBy)


    }, [showChat])





    /**
    * Filter UserData and 
    */

    useEffect(() => {

        handleSearch()
        handleChatSearch()

    }, [userDataList, userId, searchText]);



    /**
      * Handle Search Function 
    */

    const handleSearch = () => {

        setAddUser(false);

        let filteredUserData;
        if (!searchText || searchText.trim() === "") {
            filteredUserData = userData;
        } else {
            filteredUserData = userData?.filter(item =>
                item.receiver.userName.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        setFilterData(filteredUserData);
    };
  
    //Handle Search in Chat ...
    const handleChatSearch = () => {

        setAddUser(false)
        let filteredUserData;
        if (!searchText || searchText.trim() === "") {
            filteredUserData = chatHistory
        } else {
            filteredUserData = chatHistory?.filter(item =>
                item?.message?.toLowerCase()?.includes(searchText?.toLowerCase())
            );
        }
        setFilterChat(filteredUserData);
    }


    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1200) {
                setIsWindow(true);
            } else {
                setIsWindow(false);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);


    /**
     * Get All User List ...
     */

    const getAllUsersList = async () => {
        try {
            const response = await cs.get('getUserList', 'users', {}, headers);
            if (response?.data?.code === 200) {
                const userList = response?.data?.data.filter(user => user._id !== userId);
                let filterOption = userList?.map(user => (
                    {
                        value: user?._id,
                        label: user?.userName,
                        receiver_id: user?._id
                    }
                ))
                setAllUserData(filterOption)
            }
        }
        catch (error) {
            console.log(error)
        }
    }


    useEffect(() => {
        getAllUsersList()
        fetchRooms();
    }, [])



    useEffect(() => {
        if (isWindow) {
            document.body.classList.add('hidden');
        } else {
            document.body.classList.remove('hidden');
        }
    }, [isWindow]);



    /**
     * Handle Send Message Function
     */

    const handleSendMessage = () => {

        if (chatMessage) {
            let receiverId;
            if (activeChatUser?.receiver_id) {
                receiverId = activeChatUser?.receiver_id
            } else {
                const newReceiverId = userData.find(item => item._id === activeChatUser._id && item.participants.find(participantId => participantId !== userId));
                receiverId = newReceiverId?.receiver?._id;
            }
            const data = {
                senderId: userId,
                reciverId: receiverId,
                message: chatMessage
            };

            //socket to send message ...
            socket.emit('message', data);
            getMessage();
            getChatMessagesList()
            document.getElementById('messageInput').textContent = '';
            fetchRooms();
            setChatMessage('');
        }

    };

    //Handle Enter Press ...

    const handleKeyPress = (event) => {

        if (event.key === 'Enter') {
            event.preventDefault();
            handleSendMessage()
        }
        fetchRooms()

    }


    /**
     * Get Rooms List ...
     */
    const fetchRooms = async () => {
        try {
            const response = await cs.get(`roomList/${userId}`, 'chatMessage', {}, headers);
            if (response?.data?.code == 200) {
                setFilterData(response?.data?.data)
                setUserData(response?.data?.data);
            }
        }
        catch (error) {
            console.log(error)
        }
    }


    /**
     * Socket to Track Unread Messages ...
     */

    const trackReadMessage = (room_Id, lastMessageBy) => {

        let data = {
            roomId: room_Id,
            userId: lastMessageBy,
        }

        socket.emit('updateRoomCount', data);

    }


    useEffect(() => {
        if (activeChatUser)
            trackReadMessage(activeChatUser?._id, activeChatUser?.lastMessageBy)
    }, [activeChatUser])



    /**
     * Scroll Chat to Bottom ...
     */
    const scrollToBottom = () => {

        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }

    };


    useEffect(() => {
        fetchRooms()
        trackReadMessage(activeChatUser?._id, activeChatUser?.lastMessageBy)
    }, [isChat])


    /**
     * Get Message  ...
     */

    const getMessage = (receivedData) => {

        setChatHistory(prevHistory => [...prevHistory, receivedData]);
        setFilterChat(prevHistory => [...prevHistory, receivedData]);


        if (!isChat) {
            setUserData(prevUserDataList => {
                if (prevUserDataList?._id !== userId) {
                    let updatedUserDataList = prevUserDataList;
                    updatedUserDataList = updatedUserDataList?.map((item) => {
                        if (item._id === receivedData?.roomId) {
                            item.lastMessage = receivedData.message;
                            item.lastMessageDate = receivedData.lastMessageDate;
                            item.unreadMessageCount = receivedData.unreadCount;
                        }
                        return item;
                    })
                    return updatedUserDataList;
                }
            });
        }

    };


    useEffect(() => {
        socket.on('newMessage', getMessage);
        return () => {
            socket.off('newMessage', getMessage);
        };
    }, [socket, handleSendMessage]);


    useEffect(() => {
        scrollToBottom();
    }, [isChat]);


    const handleInput = (e) => {
        setChatMessage(e.target.textContent);
    };


    //Handle Emojii Select ...
    const handleEmojiClick = (emoji) => {
        const inputElement = document.getElementById('messageInput');
        const newMessage = inputElement.innerHTML + emoji.emoji;
        setChatMessage(newMessage);
        inputElement.innerHTML = newMessage;
    };



    return (
        <React.Fragment>
            <div className='chat-wrapper' onClick={() => handleAddActive()} >
                <div className='chat-header' >
                    {isChat ? '' : <div className='chat-close' onClick={() => handleHideChat()}><PreviousArrow /></div>}
                    {isChat ? <div className='back-btn' onClick={() => handelBackButton()}><PreviousArrow /></div> : ''}
                    <div className='chat-title' onClick={handleAddActive}>Chat</div>
                    {!isChat ? <div className={`add-icon ${true ? 'active' : ''}`} onClick={() => handleAddUser()}><AddIcon /></div>
                        : <div className='active-user-wrap'>
                            <div className='active-user-name'>{activeChatUser?.receiver?.userName}</div>
                            <div className='active-user-img active'>
                                <img src={ChatPlaceholder} alt='User' />
                            </div>
                        </div>}
                    {!isChat && <div className={`add-user-wrap react-select ${addUser ? 'active' : ''}`}>
                        <div className='icon-wrap'><SearchIcon /></div>
                        <Select className="react-select-container"
                            classNamePrefix="react-select" options={allUsersData} components={{ Option }} onChange={(selectedOption) => handleNewChat(selectedOption)} />
                    </div>}
                </div>
                <div className='chat-container'>
                    <div className='chat-search-wrap'>
                        <div className='chat-search'>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Search..."
                                    name="search"
                                    onChange={(e) => { setSearchText(e.target.value) }}
                                />
                                <InputGroup.Text  >
                                    <div className='icon-wrap' onClick={isChat ? handleSearch : handleChatSearch} ><SearchIcon /></div>
                                </InputGroup.Text>
                            </InputGroup>
                        </div>
                    </div>
                    {isChat ?
                        <>
                            <div className='chat-area-wrapper' >
                                <Scrollbars className='chat-scroll-wrapper' style={{ width: '100%', height: '100%', paddingBottom: '20px' }} disableHorizontalScrolling>
                                    {filterChat && filterChat?.map((me) => (
                                        me && <div className='chat-area'>
                                            {me?.senderId !== userId && <div className='chat-content-row'>
                                                <div className='user-img-wrap active'>
                                                    <img src={AvatarImg} alt='Avatar' />
                                                </div>
                                                <div className='chat-content-wrap'>
                                                    <div className='user-info-wrap'>
                                                        <div className='user-name'>{activeChatUser?.receiver?.userName}</div>
                                                        <div className='chat-time-wrap'>{moment(me?.createdAt).format('dddd h:mma')}</div>
                                                    </div>
                                                    <div className='chat-message-wrap'>{me?.message}</div>
                                                </div>
                                            </div>}
                                            {me?.senderId === userId && <div className='chat-content-row sender'>
                                                <div className='user-img-wrap active'>
                                                    <img src={userDetails?.image ? userDetails?.image : UserImg} alt='Avatar' />
                                                </div>
                                                <div className='chat-content-wrap'>
                                                    <div className='user-info-wrap'>
                                                        <div className='user-name'>{userDetails?.userName}</div>
                                                        <div className='chat-time-wrap'>{moment(me?.createdAt).format('dddd h:mma')}</div>
                                                    </div>
                                                    <div className='chat-message-wrap'>{me?.message}</div>
                                                </div>
                                            </div>}
                                        </div>
                                    ))}
                                    <div ref={bottomRef}></div>
                                </Scrollbars>

                                <div className='chat-footer'>
                                    <div className='add-files'>
                                        <input id='media' type='file' />
                                        <label htmlFor='media'><AddIcon /></label>
                                    </div>
                                    <span style={{ cursor: 'pointer' }} onClick={() => { setShowEmoji(!showEmoji) }}>😊</span>
                                    <div className='enter-mesage-wrap'>
                                        <span role="textbox"
                                            contentEditable
                                            onInput={handleInput}
                                            id="messageInput"
                                            onKeyPress={handleKeyPress}
                                            suppressContentEditableWarning={true}
                                        ></span>

                                    </div>
                                    <div className='send-message'>
                                        <Button variant='link' type='submit' onClick={handleSendMessage}><PaperBoatIcon /></Button>
                                    </div>

                                </div>
                            </div>
                            {showEmoji && <EmojiPicker open={showEmoji} onEmojiClick={(emoji) => handleEmojiClick(emoji)} style={{ position: 'absolute', top: '-8px', right: '390px', width: '300px', height: '380px' }} />}
                        </>
                        :
                        <>
                            <div className='chat-user-list-wrap' onClick={handleAddActive}>

                                <Scrollbars className='chat-scroll-wrapper' style={{ width: '100%', height: '100%' }} disableHorizontalScrolling>
                                    <div className='chat-user-list'>
                                        {filterData && filterData?.map((item) => (
                                            item && item._id !== userId && (
                                                <div className='chat-user' key={item._id}>
                                                    <div className='chat-user-row' onClick={() => handleChat(item)}>
                                                        <div className={`user-thumbnail ${true ? 'active' : 'inactive'}`}>
                                                            <img src={AvatarImg} alt='' />
                                                        </div>
                                                        <div className='chat-user-info-wrap'>
                                                            <div className='chat-user-title'>{item?.receiver?.userName}</div>
                                                            <div className='chat-notification-message'>{item?.lastMessage}</div>
                                                        </div>
                                                        <div className='chat-notification'>
                                                            {item?.lastMessageBy !== userId && item && item?.unreadMessageCount !== 0 && (
                                                                <div className='chat-notification-count'>{item?.unreadMessageCount}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </Scrollbars>
                            </div>

                        </>
                    }
                </div>
            </div>

        </React.Fragment>
    )
}

export default Chat