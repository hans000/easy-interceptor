import zh_CN from '../../public/_locales/zh_CN/messages.json'
import en from '../../public/_locales/en/messages.json'

export default function useTranslate(lang: 'zh_CN' | 'en' = 'zh_CN') {
    const __DEV__ = import.meta.env.DEV
    if (__DEV__) {
        return (key: string, substitutions?: Array<string | number>) => {
            const message = { zh_CN, en }[lang][key]?.message
            if (message === undefined) {
                return key
            }
            let index = 0
            return message.replace(/\$(.+)\$/g, (_, k) => {
                return substitutions[index++]
            })
        }
    }
    return (key: string, substitutions?: Array<string | number>) => chrome.i18n.getMessage(key, substitutions)
}