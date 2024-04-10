import React, { useEffect, useState } from 'react'

import Form from 'react-bootstrap/Form';
import { Button, Modal } from 'react-bootstrap';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

import * as cs from "../../Api/cs"
import useHeader from '../../Helper/useHeader';
import CreatableSelect from 'react-select/creatable';
import { CloseIcon, DeleteIcon, ImageIcon, TrackIcon } from '../../Component/Icons';
import { addTrackSchema } from '../../ValidationSchema/validationSchema';

const AddNewTrackModal = ({ showAddTrack, handleAddTrackClose }) => {

    const { handleSubmit, setValue, formState: { errors, isValid }, 
    register, watch, clearErrors, trigger } = useForm({
        resolver: yupResolver(addTrackSchema),
        mode: 'onChange',
    });

    //State Variables ..
    const [tag, setTag] = useState([]);
    const [mood, setMood] = useState([]);
    const [image, setImage] = useState(null)
    const [genreList, setGenreList] = useState([]);
    const [moodValue, setMoodValue] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const headers = useHeader()


    useEffect(() => {

        if (watch('mood')) {
            trigger('mood');
        }

    }, [watch('mood')]);

    useEffect(() => {

        if (watch('tag')) {
            trigger('tag');
        }

    }, [watch('tag')]);


    /**
     * onSubmit ...
     */
    const onSubmit = async (data) => {
        try {
            let image;
            let video;


            if (data?.fileInput && data?.fileInput?.[0]) {

                const videoFormObj = new FormData()
                videoFormObj.append("data", data?.fileInput?.[0])
                video = await cs.post('upload', 'util', videoFormObj, headers)

            }

            if (data?.imageInput) {

                const imgFormObj = new FormData()
                imgFormObj.append("data", data?.imageInput?.[0])
                image = await cs.post('upload', 'util', imgFormObj, headers)

            }


            const track_data = {

                "track_image": image?.data?.data,
                "track_video": video?.data?.data,
                "track_name": data?.trackNameInput,
                "track_description": data?.trackDescriptionInput,
                "track_genre": data?.genreSelect,
                "track_tags": data?.tag,
                "track_moods": data?.mood,
                "status": "active",
                "track_add": 1

            }

            const response = await cs.post('add', 'track', track_data, headers)
        }
        catch (error) {
            console.log(error)
        }

    }


    /**
     * Handle Key Down ...
     */
    const handleKeyDown = (event) => {

        if (event?.key === ' ' && inputValue?.trim() !== '') {
            const newTag = { label: inputValue?.trim(), value: inputValue?.trim() };
            const updatedTags = [...tag, newTag];
            setValue('tag', updatedTags?.map(tag => tag?.value));
            setTag(updatedTags);
            setInputValue('');
        }

    };

    /**
     * Get Genre List ...
     */
    const getGenreList = async () => {
        try {
            const response = await cs.get('list', 'genre', null, headers)
            if (response?.data?.code == 200) {
                setGenreList(response?.data?.data)
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    /**
     * Mood Handle Key Down ...
    */

    const moodHandleKeyDown = (event) => {

        if (event?.key === ' ' && moodValue?.trim() !== '') {
            const newTag = { label: moodValue?.trim(), value: moodValue?.trim() };
            const updatedTags = [...mood, newTag];
            setMood(updatedTags);
            setValue('mood', updatedTags?.map(mood => mood?.value));
            setMoodValue('');
        }

    };


    useEffect(() => {
        getGenreList()
    }, [])


    return (
        <Modal show={showAddTrack} onHide={handleAddTrackClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add A New Track</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="w-100">
                    <form className='battle-form' onSubmit={handleSubmit(onSubmit)}>

                        <div className="add-new-track">
                            <>
                                <Form.Group className='file-upload-image  form-row' >
                                    {!image &&
                                        <label htmlFor="imageInput">
                                            <ImageIcon />
                                            <input type="file"
                                                id="imageInput"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    setValue('imageInput', e.target.files);
                                                    setImage(URL.createObjectURL(e.target.files[0]));
                                                    clearErrors('imageInput');
                                                }} />
                                            <div className='file-upload-text'>
                                                Choose image<br />
                                                or drop it here
                                            </div>
                                        </label>
                                    }

                                    {image &&
                                        <div className='image-upload-holder'>
                                            <img src={image} alt='user' />
                                            <div className='delete-img-wrap' onClick={() => setImage(null)}>
                                                <DeleteIcon />
                                            </div>
                                        </div>
                                    }

                                    {errors.imageInput && <div className="errorMsg">{errors.imageInput.message}</div>}
                                </Form.Group>

                                <Form.Group className='form-row file-upload-audio'>

                                    {!selectedFile &&
                                        <> <label htmlFor="fileInput">
                                            <input type="file" id="fileInput" accept=".mp3,.mp4" onChange={(e) => {
                                                setValue('fileInput', e.target.files);
                                                setSelectedFile(e.target.files[0]);
                                                clearErrors('fileInput');
                                            }} />

                                            <div className='icon-wrap'><TrackIcon /></div>
                                            <div className='file-upload-text'>Choose track or <br />
                                                drop it here <br />
                                                (in .mp3 format)</div>
                                        </label>
                                        </>
                                    }

                                    {selectedFile && <>
                                        <label >
                                            <div className='icon-wrap'><TrackIcon /></div>
                                            <div className='file-upload-text'>{selectedFile.name}
                                            </div>
                                            <div className='close-wrap' onClick={() => setSelectedFile(null)}>
                                                <CloseIcon />
                                            </div>
                                        </label>
                                    </>}

                                    {errors.fileInput && <div className="errorMsg">{errors.fileInput.message}</div>}
                                </Form.Group>

                                <Form.Group className='form-row' >
                                    <Form.Control type="text" id="trackNameInput" {...register('trackNameInput')} placeholder='Track Name' />
                                    {errors.trackNameInput && <div className="errorMsg">{errors.trackNameInput.message}</div>}
                                </Form.Group>

                                <Form.Group className='form-row'>
                                    <Form.Control as="textarea" id="trackDescriptionInput" {...register('trackDescriptionInput')} placeholder='Track Description' />
                                    {errors.trackDescriptionInput && <div className="errorMsg">{errors.trackDescriptionInput.message}</div>}
                                </Form.Group>

                                <Form.Group className='form-row'>
                                    <Form.Select id="genreSelect" {...register('genreSelect')}>
                                        <option value="">Select Genre</option>
                                        {genreList?.map((genre) => (
                                            <option key={genre?._id} value={genre?._id}>
                                                {genre?.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    {errors.genreSelect && <div className="errorMsg">{errors.genreSelect.message}</div>}
                                </Form.Group>


                                <Form.Group className="form-row react-select">
                                    <CreatableSelect
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        inputValue={moodValue}
                                        isClearable
                                        isMulti
                                        {...register('mood')}
                                        menuIsOpen={false}
                                        onChange={(selectedTags, actionMeta) => {
                                            const selectedTagValues = selectedTags.map(mood => mood.value);
                                            setMood(selectedTags);
                                            setValue('mood', selectedTagValues);
                                        }}
                                        onInputChange={(newValue) => setMoodValue(newValue)}
                                        onKeyDown={moodHandleKeyDown}
                                        placeholder="Moods(3)"
                                        value={mood}
                                    />
                                    {errors?.mood && <p className="errorMsg">{errors?.mood?.message}</p>}
                                </Form.Group>

                                <Form.Group className="form-row react-select">
                                    <CreatableSelect
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        inputValue={inputValue}
                                        isClearable
                                        isMulti
                                        {...register('tag')}
                                        menuIsOpen={false}
                                        onChange={(selectedTags, actionMeta) => {
                                            const selectedTagValues = selectedTags.map(tag => tag.value);
                                            setTag(selectedTags);
                                            setValue('tag', selectedTagValues);
                                        }}
                                        onInputChange={(newValue) => setInputValue(newValue)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Tags(3)"
                                        value={tag}
                                    />
                                    {errors?.tag && <p className="errorMsg">{errors?.tag?.message}</p>}
                                </Form.Group>

                            </>
                        </div>

                        <div className='d-flex justify-content-center'>
                            <Button variant="primary" type="submit" disabled={!isValid}>
                                Publish Track
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal.Body>

        </Modal>
    )
}

export default AddNewTrackModal
