import { Button } from 'antd'
import Checkbox from 'antd/lib/checkbox/Checkbox'
import React, { useEffect, useState } from 'react'
import './App.less'
import TransformerItem, { TransformResult } from './components/TransformerItem'
import { CloseOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'

window.setting = {
    __hs_rules: [],
    __hs_enable: false,
    __hs_index: -1,
}

const __DEV__ = import.meta.env.DEV

function App() {

	const [data, setData] = useState<TransformResult[]>([])
	const [actIndex, setActIndex] = useState(-1)
	const [enable, setEnable] = useState(true)

	useEffect(
		() => {
			if (! __DEV__) {
				chrome.storage.local.get(['__hs_enable', '__hs_rules', '__hs_index'], (result: any) => {
					window.setting = { ...window.setting, ...result }
					setData(() => window.setting.__hs_rules)
					setEnable(() => window.setting.__hs_enable)
					setActIndex(() => window.setting.__hs_index)
				})
			}
		},
		[]
	)

	const updateIndex = (__hs_index: number) => {
		setActIndex(() => __hs_index)
		if (! __DEV__) {
			chrome.storage.local.set({ __hs_index })
		}
	}

	const cls = React.useCallback(
		(index) => {
			const list = ['nav__item']
			if (index === actIndex) {
				list.push('active')
			}
			if (!enable || !data[index].enable) {
				list.push('disable')
			}
			return list.join(' ')
		},
		[actIndex, data, enable]
	)

	const clsTop = React.useMemo(
		() => {
			const list = ['app__top']
			if (enable) {
				list.push('active')
			}
			return list.join(' ')
		},
		[enable]
	)

	return (
		<div className="app">
			<div className="app__left">
				<div className={clsTop}>
					<Button.Group>
						<Button icon={<PlusOutlined />} onClick={() => {
							setData(data => {
								const result = [...data, { text: 'api ' + data.length }]
								updateIndex(result.length - 1)
								return result
							})
						}}></Button>
						<Button icon={<DeleteOutlined />} onClick={() => {
							updateIndex(-1)
							setData(() => [])
						}}></Button>
					</Button.Group>
					<Checkbox style={{ marginLeft: 16}} onChange={() => {
						setEnable((enable) => {
							const value = !enable
							window.setting.__hs_enable = value
							!__DEV__ && chrome.runtime.sendMessage(chrome.runtime.id, {
								type: '__Hs_Transformer__',
								to: 'background',
								key: 'enable',
								value,
							})
							if (chrome.storage) {
								chrome.storage.local.set({ __hs_enable: value })
							}
							return value
						})
					}} checked={enable}>全局启用</Checkbox>
				</div>
				<div className="app__cont">
					{
						data.map((item, index) => {
							return (
								<div className={cls(index)} key={index}>
									<div title={item.text} onClick={() => updateIndex(index)}>{item.text}</div>
									<CloseOutlined onClick={() => {
										updateIndex(-1)
										setData(data => {
											const result = [...data]
											result.splice(index, 1)
											return result
										})
									}} className='nav__item-close'/>
								</div>
							)
						})
					}
				</div>
			</div>
			<div className="app__right">
				<TransformerItem onChange={(value) => {
					setData((data) => {
						const result = [...data]
						if (actIndex === -1) return result
						
						result[actIndex] = value
						window.setting.__hs_rules[actIndex] = value
						!__DEV__ && chrome.runtime.sendMessage(chrome.runtime.id, {
							type: '__Hs_Transformer__',
							to: 'background',
							key: 'rules',
							value: result
						})
						if (chrome.storage) {
							chrome.storage.local.set({ __hs_rules: result });
						}
						return result
					})
				}}
				value={data[actIndex]} />
			</div>
		</div>
	)
}

export default App
