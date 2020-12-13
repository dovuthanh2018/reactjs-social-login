/* eslint-disable camelcase */
/**
 *
 * LoginSocialGithub
 *
 */
import React, { memo, useCallback, useEffect, useState } from 'react'
import { IResolveParams, objectType } from 'types'

interface Props {
  state?: string
  scope?: string
  client_id: string
  className?: string
  redirect_uri: string
  client_secret: string
  allow_signup?: boolean
  children?: React.ReactNode
  onReject: (reject: string | objectType) => void
  onResolve: ({ provider, data }: IResolveParams) => void
}

const GITHUB_URL: string = 'https://github.com'
const GITHUB_API_URL: string = 'https://api.github.com/'
const PREVENT_CORS_URL: string = 'https://cors-anywhere.herokuapp.com'

export const LoginSocialGithub = memo(
  ({
    state = 'DCEeFWf45A53sdfKef424',
    scope = 'repo,gist',
    client_id,
    client_secret,
    className = '',
    redirect_uri,
    allow_signup = false,
    children,
    onReject,
    onResolve
  }: Props) => {
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
      if (window.opener && window.opener !== window) {
        const popupWindowURL = new URL(window.location.href)
        const code = popupWindowURL.searchParams.get('code')
        window.opener.postMessage({ type: 'code', code: code }, '*')
        window.close()
      }
      window.addEventListener('message', handlePostMessage)
    }, [])

    const getProfile = useCallback(
      (data) => {
        fetch(`${PREVENT_CORS_URL}/${GITHUB_API_URL}/user`, {
          method: 'GET',
          headers: {
            Authorization: `token ${data.access_token}`
          }
        })
          .then((res) => res.json())
          .then((response: any) => {
            setIsProcessing(false)
            onResolve({ provider: 'github', data: { ...response, ...data } })
          })
          .catch((err) => {
            setIsProcessing(false)
            onReject(err)
          })
      },
      [onReject, onResolve]
    )

    const getAccessToken = useCallback(
      (code: string) => {
        const params = {
          code,
          state,
          redirect_uri,
          client_id,
          client_secret
        }
        const headers = new Headers({
          'Content-Type': 'application/x-www-form-urlencoded'
        })

        fetch(`${PREVENT_CORS_URL}/${GITHUB_URL}/login/oauth/access_token`, {
          method: 'POST',
          headers,
          body: new URLSearchParams(params)
        })
          .then((response) => response.text())
          .then((response) => {
            const data: objectType = {}
            const searchParams: any = new URLSearchParams(response)
            for (const p of searchParams) {
              data[p[0]] = p[1]
            }
            if (data.access_token) getProfile(data)
            else {
              setIsProcessing(false)
              onReject('no data')
            }
          })
          .catch((err) => {
            setIsProcessing(false)
            onReject(err)
          })
      },
      [client_id, client_secret, getProfile, onReject, redirect_uri, state]
    )

    const handlePostMessage = useCallback(
      async (event: any) => {
        if (event.data.type === 'code') {
          window.removeEventListener('message', handlePostMessage)
          const { code } = event.data
          getAccessToken(code)
        }
      },
      [getAccessToken]
    )

    const onLogin = useCallback(() => {
      if (!isProcessing) {
        setIsProcessing(true)
        const oauthUrl = `${GITHUB_URL}/login/oauth/authorize?client_id=${client_id}&scope=${scope}&state=${state}&redirect_uri=${redirect_uri}&allow_signup=${allow_signup}`
        const width = 450
        const height = 730
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2
        window.open(
          oauthUrl,
          'Github',
          'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' +
            width +
            ', height=' +
            height +
            ', top=' +
            top +
            ', left=' +
            left
        )
      }
    }, [isProcessing, client_id, scope, state, redirect_uri, allow_signup])

    return (
      <div className={className} onClick={onLogin}>
        {children}
      </div>
    )
  }
)

export default LoginSocialGithub
