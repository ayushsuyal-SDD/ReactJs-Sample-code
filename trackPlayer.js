import React, { useEffect, useState } from 'react'


import './TrackPlayer.scss';
import * as cs from "../../Api/cs"
import useHeader from '../../Helper/useHeader';
import TrackThumbnailImg from '../../assets/images/track-thumnail.png'
import {
    handleShowPlayer,
    updateArtistId,
    updateIsPlaying,
    updateTrack,
    updateTrackProgress
} from '../../Redux/Slices/player.slice';


import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ColoredStarIcon, PauseIcon, PlayIcon, PlayMenuIcon, StarIcon } from '../Icons';


const TrackPlayer = ({ trackToBePlayed }) => {

    const [isFav, setIsFav] = useState(false)

    //State Variables ...
    const headers = useHeader()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { userId } = useSelector(state => state.user)
    const { showPlayer, track, artistId, isPlaying } = useSelector(state => state?.player)


    //Handle Player ...
    const handlePlayer = () => {

        if (!showPlayer) {
            dispatch(handleShowPlayer())
        }

        dispatch(updateArtistId(trackToBePlayed?.createdBy?._id))
        dispatch(updateTrack(trackToBePlayed))
        dispatch(updateIsPlaying(true))
        dispatch(updateTrackProgress(0))


        if (isPlaying && track?._id === trackToBePlayed?._id) {
            dispatch(updateIsPlaying(false))
        }

    }

   //Handle Track Page ...
    const handleTrackPage = () => {
        navigate('/private/track-page', { state: { trackId: trackToBePlayed?._id } })
    }

    useEffect(() => {
        favoriteCheck()
    }, [])


    /**
     * Favorite Check ...
     */
    const favoriteCheck = async () => {

        const response = await cs.get('list/' + userId + '/' + trackToBePlayed?._id, 'myFav', {}, headers)
        if (response?.data?.value === true) {
            setIsFav(true)
        }
        else if (response?.data?.value === false) {
            setIsFav(false)
        }

    }

   //get Play and Pause Button ...
    const getPlayPause = () => {

        return isPlaying ? <PauseIcon /> : <PlayIcon />;

    }


    return (
        <React.Fragment>
            <div className='trackplayer-wrapper' >
                <><div className='track-thmbnail'>
                    <img src={TrackThumbnailImg} alt="Track" />
                    <div className='track-control' onClick={handlePlayer}>
                        {getPlayPause()}
                    </div>
                </div>
                    <div className='track-detail-wrap' onClick={handleTrackPage}>
                        <div className='track-info-wrap'>
                            <div className='track-author-detail'>
                                <div className='track-author-name'>{trackToBePlayed?.createdBy?.email}</div>
                                <div className='track-name'>{trackToBePlayed?.track_name}</div>
                            </div>
                            <div className='track-time'>3:00</div>
                        </div>
                        <div className='track-detail-right'>
                            <div className='track-play-time'>
                                <div className='total-play-time'>{trackToBePlayed?.track_count}  plays</div>
                                <div className='track-play-divider'>
                                    <span></span>
                                </div>
                                <div className='total-save'>50 saves</div>
                            </div>
                            <div className='tracking-rating'  >{isFav ? <ColoredStarIcon /> : <StarIcon />}</div>
                            <div className='track-play-menu'><PlayMenuIcon /></div>
                        </div>
                    </div></>

            </div>
        </React.Fragment>
    )
}

export default TrackPlayer