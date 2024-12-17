'use client'
import React, { useState } from 'react'

const NewClientModal = ({active, handleModal, handleResponse}) => {

    /* New Data */

    const [newData, setNewData] = useState({
        typedni:'',
        dni:'',
        name: '',
        email: '',
        phone: '',
        address: ''
    })

    const [errEmail, setErrEmail] = useState(false)

    const [errIncomplete, setErrIncomplete] = useState(false)
  
    const handleNewData = (e) =>{
  
      const {name, value} = e.target
  
      if (name === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          if (value.length < 1) {
            setErrEmail(false)
          } else {
            setErrEmail(true)
          }
        } else {
          setErrEmail(false)
        }
      }
  
      setNewData((prev) => ({
        ...prev,
        [name]:value
      }))
    }

    const handleIncomplete = () => {
        setErrIncomplete(true)
      
        setTimeout(() => {
          setErrIncomplete(false)
        }, 5000)
    }

    const sendData = () => {
        if(newData.name.length === 0 || newData.email.length === 0 || errEmail || newData.dni.length === 0 || newData.phone.length === 0 || newData.address.length === 0 || newData.typedni.length === 0) {
            handleIncomplete()
            return false
        }else{
            setErrIncomplete(false)
            return true
        }
    }

    const closeModal = () => {
        setNewData({
            typedni:'',
            dni:'',
            name: '',
            email: '',
            phone: '',
            address: ''
        })
        handleModal()
    }

    const saveAndCloseModal = (e) => {
        e.preventDefault()
        if(sendData()){
            handleResponse(newData)
        }
    }

  return (
    <div className={`overlay-modal ${active ? 'show':'hide'}`}>
        <div className="container">
            <div className="title-container st">
                <span><b>Nuevo Cliente</b></span>
            </div>
            <form className='form-container' type='submit' onSubmit={sendData}>
                <div className="row">
                <div className="input-form">
                    <div className='input-name'>
                    Tipo de DNI:
                    </div>
                    <select value={newData.typedni} onChange={handleNewData} name='typedni'>
                    <option value="">Seleccionar</option>
                    <option value="Cédula">Cédula</option>
                    <option value="RUC">RUC</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="Identificación del exterior">Identificación del exterior</option>
                    </select>
                </div>
                <div className="input-form">
                    <div className='input-name'>
                    DNI:
                    </div>
                    <input type="text" value={newData.dni} onChange={handleNewData} name='dni' maxLength={13}/>
                </div>
                </div>
                <div className="row">
                <div className="input-form">
                    <div className='input-name'>
                    Razón social
                    </div>
                    <input type="text" value={newData.name} onChange={handleNewData} name='name' maxLength={150}/>
                </div>
                <div className="input-form">
                    <div className='input-name'>
                    Email
                    </div>
                    <input className={errEmail ? 'err':''} type="text" value={newData.email} onChange={handleNewData} name='email'  maxLength={150}/>
                </div>
                </div>
                <div className="row">
                <div className="input-form">
                    <div className='input-name'>
                    Dirección:
                    </div>
                    <input type="text" value={newData.address} onChange={handleNewData} name='address' maxLength={200}/>
                </div>
                <div className="input-form">
                    <div className='input-name'>
                    Teléfono:
                    </div>
                    <input type="text" value={newData.phone} onChange={handleNewData} name='phone' maxLength={10}/>
                </div>
                </div>
                <div className="footer-a-sb">
                <div className={errIncomplete ? "error-incomplete": "error-incomplete hide"}>
                    Algunos campos estan vacios.
                </div>
                <div className="btns-container">
                    <div className={`btn-base gray-btn`}>
                        <button type='button' onClick={()=>closeModal()}>Cancelar</button>
                    </div>
                    <div className={`btn-base`}>
                        <button type='submit' onClick={(e)=>saveAndCloseModal(e)}>Guardar</button>
                    </div>
                </div>
                
                </div>
            </form>
        </div>
    </div>
  )
}

export default NewClientModal