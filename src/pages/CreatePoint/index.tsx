import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import './styles.css';
import {FiArrowLeft} from 'react-icons/fi';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet'
import api from '../../services/api';

import logo from '../../assets/logo.svg';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';


interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface IGBGEUFResponse {
    sigla: string;
}

interface IGBGECityResponse {
    nome: string;
}

const CreatePoint = () => {

    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setufs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0]);
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    });
    const [selectedItems, setselectedItems] = useState<number[]>([]);

    const history = useHistory();

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        })
    }, []);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
           const {latitude, longitude} = position.coords;

           setInitialPosition([latitude, longitude]);
        })    
    }, []);

    useEffect(() => {
        axios.get<IGBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials = response.data.map(uf => uf.sigla); 
            setufs(ufInitials);
        })
    }, []);

    useEffect(() => {
        axios.get<IGBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response => {
            const cities = response.data.map(city => city.nome); 
            setCities(cities);
        })
    }, [selectedUf]);

    function onUfChange(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedUf(event.target.value);
    }

    function onCityChange(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedCity(event.target.value);
    }

    function onMapClick(event: LeafletMouseEvent) {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ]) 
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        
        setFormData({...formData, [event.target.name]: event.target.value})
    }

    function handleSelectedItem(id: number) {
        const alreadySelected = selectedItems.findIndex(item=> item === id);

        if (alreadySelected >=0) {
            const filteredItems = selectedItems.filter(item=> item !== id);
            setselectedItems(filteredItems);
        } else 
            setselectedItems([...selectedItems, id])
    }

    async function onSubmit(event: FormEvent) {
        event.preventDefault();
    
        const { name, email, whatsapp } = formData;

        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;

        const items = selectedItems;

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        };

      await  api.post('points', data);

      history.push('/')
    }


    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>

                <Link to="/">
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={onSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome</label>
                        <input 
                            onChange={handleInputChange}
                            type="text"
                            name="name"
                            id="name"
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="email">E-mail</label>
                        <input 
                        onChange={handleInputChange}
                            type="email"
                            name="email"
                            id="email"
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="whatsapp">Whatsapp</label>
                        <input 
                        onChange={handleInputChange}
                            type="text"
                            name="whatsapp"
                            id="whatsapp"
                        />
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onclick={onMapClick}>
                    <TileLayer
                    attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                    <div className="field">
                        <label htmlFor="uf"> Estado</label>
                        <select name="uf" id="uf" value={selectedUf} onChange={onUfChange}>
                            <option value="0">Selecione uma estado</option>
                            {ufs.map(uf => (<option key={uf} value={uf}>{uf}</option>))}
                        </select>
                    </div>

                    <div className="field">
                        <label htmlFor="city"> Cidade</label>
                        <select name="city"  id="city" value={selectedCity} onChange={onCityChange}>
                            <option value="0">Selecione uma cidade</option>
                            {cities.map(city => (<option key={city} value={city}>{city}</option>))}
                        </select>
                    </div>
                </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>ítens de coleta</h2>
                    </legend>

                    <ul className="items-grid">
                      {items.map(item => 
                        <li
                         className={selectedItems.includes(item.id) ? 'selected' : ''}
                         onClick={() => handleSelectedItem(item.id)} key={item.id}>
                            <img src={item.image_url} alt={item.title}/>
                            <span>{item.title}</span>
                        </li>
                        )}
                        
                    </ul>

                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>

        </div>
        )
}


export default CreatePoint;