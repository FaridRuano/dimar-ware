'use client'

import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import DimarLogo from '@public/assets/imgs/logo-login.webp'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { jwtDecode } from "jwt-decode";

const page = () => {

  const router = useRouter()

  const [error, setError] = useState('')

  /* Login Info */

  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const res = await axios.post('/api/login', { email, password })
      if (res.status === 200) {
        if (res.data.token) {
          localStorage.setItem('APSOQMEU', res.data.token)
          const decoded = jwtDecode(res.data.token)
          const userRole = decoded.rol
          if(userRole === 'Administrador'){
            router.push('/manager')
          }else if(userRole === 'Gerente'){
            router.push('/manager')
          }else if(userRole === 'Vendedor'){
            router.push('/sales')
          }else if(userRole === 'Bodeguero'){
            router.push('/storage')
          }else if(userRole === 'Cajero'){
            router.push('/billing')
          }
        }
      }
    } catch (err) {
      console.log(err)
      setError('Credenciales inválidas')
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('APSOQMEU');

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userRole = decoded.rol
        if(userRole === 'Administrador'){
          router.push('/manager')
        }else if(userRole === 'Gerente'){
          router.push('/manager')
        }else if(userRole === 'Vendedor'){
          router.push('/sales')
        }else if(userRole === 'Bodeguero'){
          router.push('/storage')
        }else if(userRole === 'Cajero'){
          router.push('/billing')
        }
      } catch (error) {
        console.error('Token no válido o expirado', error)
      }
    }
  }, [router])

  return (
    <div className='dim-login'>
      <div className="content-warp">
        <div className="warp">
          <div className="img-holder">
            <Image src={DimarLogo} width={365} height={128} alt='Dimar Group' />
          </div>
        </div>
        <div className="warp">
          <form onSubmit={handleLogin} className="container">
            <h5 className='login-title'>
              Iniciar Sesión
            </h5>
            <div className="login-input">
              <span>Usuario</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="login-input">
              <span>Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="login-btn">
              <button type="submit">Ingresar</button>
            </div>
            <div className='error-p'>
              {error}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default page 