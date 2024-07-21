/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { Button, Col, Divider, Form, Input, Row, Switch } from "antd";
import { ConfigInfoType } from "../../App";
import useTranslate from "../../hooks/useTranslate";
import { useEffect } from "react";

export default function Settings(props: {
    value: ConfigInfoType
    onChange?: (value: ConfigInfoType) => void
}) {
    const [form] = Form.useForm()
    const t = useTranslate()

    useEffect(() => {
        form.setFieldsValue(props.value)
    }, [props.value])

    return (
        <Form form={form} style={{ width: 750 }} onValuesChange={(_, values) => {
            props.onChange?.(values)
        }}>
            <Divider orientation='left' plain>
                <Button size='small' type='primary' onClick={() => {
                    form.setFieldsValue({ fakedLog: true, bootLog: true, dark: false, allFrames: false })
                    props.onChange?.(form.getFieldsValue())
                }}>{t('action_reset')}</Button>
            </Divider>
            <Row>
                <Col span={8}>
                    <Form.Item name={'allFrames'} label={t('action_all_frames')}>
                        <Switch />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name={'dark'} label={t('action_theme')}>
                        <Switch />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name={'bootLog'} label={t('action_boot_log')}>
                        <Switch />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name={'fakedLog'} label={t('action_faked_log')}>
                        <Switch />
                    </Form.Item>
                </Col>
                <Col span={16}>
                    <Form.Item name={'whiteList'} label={t('action_white_list')}>
                        <Input placeholder={t('placeholder_white_list')} />
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    )
}