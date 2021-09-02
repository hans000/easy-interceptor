import { Button, Input, Table, Tag, Tooltip } from 'antd'
import Checkbox from 'antd/lib/checkbox/Checkbox'
import React, { useEffect, useState } from 'react'
import './App.less'
import TransformerItem, { Result, TransformResult } from './components/TransformerItem'
import { DeleteOutlined, PlusOutlined, CaretRightOutlined, SearchOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/lib/table'
import minimatch from 'minimatch'
import { randID } from './utils'

window.setting = {
	__hs_enable: false,
    __hs_index: -1,
    __hs_rules: [],
}

const __DEV__ = import.meta.env.DEV

function getMethodColor(method: string) {
	return {
		get: 'green',
		post: 'geekblue',
		option: 'cyan',
		delete: 'warning',
		put: 'lime',
	}[method]
}

function App() {

	const [data, setData] = useState<TransformResult[]>([])
	const [actIndex, setActIndex] = useState(-1)
	const [enable, setEnable] = useState(true)
	const [expandedRowKeys, setExpandedRowKeys] = useState([])
	const [selectedRowKeys, setSelectedRowKeys] = useState([])

	useEffect(
		() => {
			if (! __DEV__) {
				chrome.storage.local.get(['__hs_enable', '__hs_rules', '__hs_index'], (result: any) => {
					window.setting = { ...window.setting, ...result }
					setData(window.setting.__hs_rules)
					setEnable(window.setting.__hs_enable)
					setActIndex(window.setting.__hs_index)
				})
			}
		},
		[]
	)

	const updateIndex = (__hs_index: number) => {
		setActIndex(__hs_index)
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

	const columns = React.useMemo<ColumnsType<any>>(
		() => {
			return [
				{
					title: '地址url', dataIndex: 'url', key: 'url', ellipsis: true,
					filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
					filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
						<div style={{ padding: 8 }}>
							<Input placeholder='搜索关键字'
								style={{ display: 'block', marginBottom: 8, width: 300 }}
								onChange={e => {
									const v = e.target.value
									const [, k] = (selectedKeys[0] || '').toString().split('\n')
									setSelectedKeys([[v, k].join('\n')])
									confirm({ closeDropdown: false });
								}} />
							<Input placeholder='排除选项，glob规则'
								style={{ display: 'block', width: 300 }}
								onChange={e => {
									const v = e.target.value
									const [k] = (selectedKeys[0] || '').toString().split('\n')
									setSelectedKeys([[k, v].join('\n')])
									confirm({ closeDropdown: false });
								}} />
						</div>
					),
					onFilter(value: string, record) {
						const [k, e] = value.split('\n')
						const include = record.url.includes(k)
						const exclude = e ? e.split(',').some(el => minimatch(record.url, el)) : false
						return record.url ? (include && !exclude) : true
					},
				},
				{
					title: '请求类型', dataIndex: 'method', key: 'method', width: 100, align: 'center' as any,
					filters: [
						{ text: 'get', value: 'get' },
						{ text: 'post', value: 'post' },
						{ text: 'put', value: 'put' },
						{ text: 'delete', value: 'delete' },
						{ text: 'options', value: 'options' },
					],
					onFilter: (value, record) => record.method.includes(value),
					render: value => value ? <Tag color={getMethodColor(value)}>{value}</Tag> : null
				},
				{
					title: '启用拦截', dataIndex: 'enable', key: 'enable', width: 100, align: 'center' as any,
					filters: [
						{ text: '启用', value: true },
						{ text: '停用', value: false },
					],
					onFilter: (value, record) => record.enable === value,
					render: (value, record, index) => <Checkbox checked={value} onChange={(e) => {
						setData(data => {
							const result = [...data]
							result[index].enable = e.target.checked
							return result
						})
					}}></Checkbox>
				},
			]	
		},
		[]
	)

	useEffect(
		() => {
			!__DEV__ && chrome.runtime.sendMessage(chrome.runtime.id, {
				type: '__Hs_Transformer__',
				to: 'background',
				key: 'rules',
				value: data
			})
			if (chrome.storage) {
				chrome.storage.local.set({ __hs_rules: data });
			}
		},
		[data]
	)

	const update = (value: Result, index: number) => {
		setData(data => {
			const result = [...data]
			const obj = result[index]
			obj.url = value.general.url
			obj.method = value.general.method
			obj.requestHeader = value.requestHeader
			obj.responseHeader = value.responseHeader
			obj.response = value.response
			return result
		})
	}

	const deleteText = React.useMemo(
		() => {
			const selLen = selectedRowKeys.length
			const len = data.length
			return selLen ? `删除${selLen}项` : len ? '' : `删除所有，共${data.length}项`
		},
		[selectedRowKeys.length]
	)

	return (
		<div className="app">
			<div className={clsTop}>
				<Button.Group style={{ paddingRight: 8 }}>
					<Button icon={<PlusOutlined />} onClick={() => {
						setData(data => {
							const result = [...data, { url: 'api ' + data.length, id: randID(), method: 'get' as any }]
							updateIndex(result.length - 1)
							return result
						})
					}}></Button>
					<Tooltip title={deleteText}>
						<Button icon={<DeleteOutlined />} onClick={() => {
							updateIndex(-1)
							if (! selectedRowKeys.length) {
								return setData([])
							}
							setData(data.filter(item => !selectedRowKeys.find(id => id === item.id)))
							setSelectedRowKeys([])
						}}></Button>
					</Tooltip>
				</Button.Group>
				<Checkbox style={{ marginLeft: 16, width:100 }} onChange={() => {
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
				<Table
					rowKey='id'
					size='small'
					pagination={false}
					columns={columns}
					scroll={{ y: 512 }}
					rowSelection={{
						selectedRowKeys,
						onChange: (keys) => {
							setSelectedRowKeys(keys)
						},
						selections: [
							Table.SELECTION_ALL,
							Table.SELECTION_INVERT,
							Table.SELECTION_NONE,
						],
					}}
					expandable={{
						expandedRowKeys,
						expandIcon: props => <CaretRightOutlined style={{ transition: '.35s ease', transform: `rotate(${props.expanded ? '90deg' : '0'})` }}
							onClick={() => {
								setExpandedRowKeys(() => props.expanded ? [] : [props.record.id])
							}}/>,
						expandedRowRender: (record: TransformResult, index: number) => {
							const value = {
								general: {
									url: record.url,
									method: record.method,
								},
								body: record.body,
								response: record.response,
								responseHeader: record.responseHeader,
								requestHeader: record.requestHeader,
							}
							return (
								<TransformerItem key={index} value={value} onChange={value => update(value, index)}/>
							)
						},
					}}
					dataSource={data}
				/>
			</div>
		</div>
	)
}

export default App
