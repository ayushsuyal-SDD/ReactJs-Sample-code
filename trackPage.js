import React, { useEffect, useState } from 'react';



import { Button } from 'react-bootstrap'
import { Swiper, SwiperSlide } from 'swiper/react';
import { useLocation, useNavigate } from 'react-router-dom';

import './TrackPage.scss';
import * as cs from '../../Api/cs';
import useHeader from '../../Helper/useHeader';
import Comment from '../../Pages/Comment/Comment';
import Header from '../../Component/Header/Header';
import Sidebar from '../../Component/Sidebar/Sidebar';
import BattleCard from '../../Component/BattelCard/BattleCard';
import TrackPlayer from '../../Component/TrackPlayer/TrackPlayer';
import {
    ColoredStarIcon, PauseIcon, PlayIcon,
    ShareIcon, StarIcon, ViewAllIcon
} from '../../Component/Icons';
import { updateBattleId } from '../../Redux/Slices/battle.slice';
import { useDispatch, useSelector } from 'react-redux';
import Player from '../../Component/Player/Player';
import {
    handleShowPlayer, updateArtistId, updateIsPlaying,
    updateTrack, updateTrackProgress
} from '../../Redux/Slices/player.slice';

const TrackPage = () => {
    
    
    //State Variables ...
    const [play, setPlay] = useState(false);
    const [isFav, setIsFav] = useState(false)
    const [artistId, setArtistId] = useState(null)
    const [otherTrack, setOtherTrack] = useState([])
    const [battleList, setBattleList] = useState([])
    const [currentTrack, setCurrentTrack] = useState({})
    const [isPlayingSong, setIsPlayingSong] = useState(false);
    
    const headers = useHeader()
    const location = useLocation()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    
    
    const { trackId } = location.state
    const { userId } = useSelector(state => state.user)
    const { showPlayer, isPlaying, track } = useSelector(state => state.player)


    useEffect(() => {
        setIsPlayingSong(isPlaying);
    }, [isPlaying]);


    //Handle Track Function ...
    const handleTrack = () => {

        if (!showPlayer) {
            dispatch(handleShowPlayer(true))
        }

        if (!currentTrack || currentTrack._id !== track._id) {

            dispatch(updateTrack(currentTrack));
            dispatch(updateTrackProgress(0));
            dispatch(updateArtistId(currentTrack?.createdBy?._id));
            dispatch(updateIsPlaying(true));

        } else if (isPlaying) {

            dispatch(updateIsPlaying(false));
            setIsPlayingSong(false)
        }
        else if (!isPlaying) {

            dispatch(updateIsPlaying(true));
            setIsPlayingSong(true)
        }

    }



    useEffect(() => {
        getTrackDetail()
        getBattleList()
        favoriteCheck()
    }, [])


    /**
     * Get Battle List ...
     */
    const getBattleList = async () => {
        try {
            const response = await cs.get('otherBattles/' + trackId, 'battel', {}, headers)
            if (response?.data?.code == 200) {
                setBattleList(response?.data?.data)
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    /**
     * Get Track Details ...
     */
    const getTrackDetail = async () => {
        try {
            const response = await cs.get('' + trackId, 'track', {}, headers)
            if (response?.data?.code == 200) {
                setCurrentTrack(response?.data?.data?.[0])
                let createdBy_Id = response?.data?.data?.[0]?.createdBy?._id;
                otherTrackByAuthor(createdBy_Id)
            }

        }
        catch (error) {
            console.log(error)
        }
    }

    //Handle Battle Card ...
    const handleBattleCard = (item) => {
        navigate('/battle-detail', { state: { itemData: item, battles: battleList } })
        dispatch(updateBattleId(item))
    }

    /**
     * Track By Author ...
     */
    const otherTrackByAuthor = async (id) => {
        try {
            const response = await cs.get('createdBy/' + id, 'track', {}, headers)
            if (response?.data.code == 200) {
                setOtherTrack(response?.data?.data)
            }

        }
        catch (error) {
            console.log(error)
        }
    }


    //Handle Track Player ...
    const handleTrackPlayer = (item) => {

        dispatch(updateIsPlaying(true))
        dispatch(updateTrack(item))

    }

    /**
     * Favorite Check ...
     */
    const favoriteCheck = async () => {
        try {
            const response = await cs.get('list/' + userId + '/' + trackId, 'myFav', {}, headers)

            if (response?.data?.value === true) {
                setIsFav(true)
            }
            else if (response?.data?.value === false) {
                setIsFav(false)
            }

        }
        catch (error) {
            console.log(error)
        }
    }

    /**
     * Add to Favorite ...
     */
    const addToFavorite = async () => {

        try {
            const _data = {
                "trackId": trackId,
                "trackName": currentTrack?.track_name,
                "userId": userId
            }
            const response = await cs.post('add', 'myFav', _data, null, headers)
            if (response?.data?.code == 200) {
                setIsFav(response?.data?.status)
            }
        }
        catch (error) {
            console.log(error)
        }

    }

    //Get Play and Pause Button ...
    const getPlayPause = () => {
        return isPlaying ? <PauseIcon /> : <PlayIcon />
    }

    return (
        <React.Fragment>
            <Header />
            <Sidebar />
            <div className='track-main-wrapper'>
                <div className='main-wrapper'>
                    <div className='main-container'>
                        <div className='track-detail-wrapper'>
                            <div className='track-thumbnail-wrap'>
                                <div className='icon-wrap' onClick={handleTrack}>
                                    {getPlayPause()}
                                </div>
                                <img src={currentTrack?.track_image} alt='Track' />
                            </div>
                            <div className='track-detail-wrap'>
                                <div className='track-author-details-wrap'>
                                    <div className='track-detail-header-wrap'>
                                        <div className='track-detail-header'>{currentTrack?.track_name}</div>
                                        <div className='track-detail-header-right'>
                                            <div className='track-report'>Report</div>
                                            <div className='icon-container'>
                                                <div className='icon-wrap' onClick={addToFavorite}>{isFav ? <ColoredStarIcon /> : <StarIcon />}</div>
                                                <div className='icon-wrap'><ShareIcon /></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='track-detail-author-name'>{currentTrack?.createdBy?.userName}</div>
                                    <div className='track-detail-description-wrap'>Description</div>
                                </div>
                                <div className='track-detail-tag-wrap'>
                                    <div className='track-detail-title'>Genres</div>
                                    <div className='tag-wrapper'>
                                        <div className='tag'>{currentTrack?.track_genre?.label}</div>
                                    </div>
                                </div>
                                <div className='track-detail-tag-wrap'>
                                    <div className='track-detail-title'>Tags</div>
                                    <div className='tag-wrapper'>
                                        <div className='tag-wrapper'>
                                            <div className='tag'>#Tag</div>
                                            <div className='tag'>#Tag</div>
                                            <div className='tag'>#Tag</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='other-battle-wrapper desktop'>
                        {battleList?.length > 0 ? <div className='other-battle-title'>Other Battles for {currentTrack?.track_name}</div> :
                            <div className='other-battle-title'>Not Added To Any Battle Yet!!!</div>}

                        <div className='other-battle-slider '>
                            <Swiper
                                spaceBetween={20}
                                breakpoints={{
                                    1500: {
                                        slidesPerView: 3.9
                                    },
                                    1250: {
                                        slidesPerView: 2.9
                                    },
                                    991: {
                                        slidesPerView: 1.9,

                                    },
                                    300: {
                                        enabled: false
                                    }
                                }}

                            >
                                {battleList && battleList?.map((item) => (
                                    <SwiperSlide onClick={() => { handleBattleCard(item?._id) }} > <BattleCard battleId={item?._id} type={item?.battleOpponentStatus === true ? 'active' : 'awaiting'} /> </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>

                    <div className='main-container'>
                        <div className='track-comment-wrapper'>
                            <div className='track-comment-wrap'>
                                <Comment type="track" id={trackId} />
                            </div>
                            <div className='other-battle-wrapper mobile'>
                                {battleList?.length > 0 ? <div className='other-battle-title'>Other Battles for {currentTrack?.track_name}</div> :
                                    <div className='other-battle-title'>Not Added To Any Battle Yet!!! </div>}
                                <div className='other-battle-slider'>
                                    <Swiper
                                        spaceBetween={20}

                                        breakpoints={{
                                            1500: {
                                                slidesPerView: 3.9
                                            },
                                            1250: {
                                                slidesPerView: 2.9
                                            },
                                            768: {
                                                slidesPerView: 1.9,

                                            },
                                            300: {
                                                enabled: false
                                            }
                                        }}

                                    >
                                        {battleList?.map((item) => (
                                            <SwiperSlide onClick={() => { handleBattleCard(item?._id) }} > <BattleCard battleId={item?._id} type={item?.opponentStatus === true ? 'active' : 'awaiting'} /> </SwiperSlide>
                                        ))}
                                    </Swiper>
                                    <div className='viewall-btn-wrap'><Button variant='secondary'><ViewAllIcon /> View all</Button></div>
                                </div>
                            </div>

                            <div className='other-track-wrap'>
                                <div className='other-track--title'>Other tracks by Author Name</div>
                                <div className='other-track'>
                                    {
                                        otherTrack?.length > 0 && otherTrack?.map((item) =>
                                        (
                                            <div onClick={() => { handleTrackPlayer(item) }} >
                                                <TrackPlayer trackToBePlayed={item} />
                                            </div>

                                        ))
                                    }

                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </React.Fragment>
    )
}

export default TrackPage
