import React from 'react'
import { Row, Col } from 'antd'
import { useSchoolList } from '@/dataModel/useSchoolList'
import { useDataModel } from '@/dataModel/index'
import { Column } from '@ant-design/charts';

export const SchoolOverview: React.FC = () => {
    const { students, enrollYear, getStudentsByYear } = useDataModel()
    const { getSchoolData, toSchoolTypeColor } = useSchoolList()

    //每一年份学生的学校数组 组成的数组
    const schools = enrollYear.map((year) => {
        return getStudentsByYear(year).map((s) => s.college)
    })

    //每一年份图表的数据
    const data = enrollYear.map((year, index) => {
        return getSchoolData(schools[index]).map((item) => {
            return { ...item, year: enrollYear[index] }
        })
    }).flat()


    const config1 = {
        data,
        xField: 'year',
        yField: 'count',
        seriesField: 'typeName',
        colorField: 'typeName',
        color: ({ typeName }: { typeName: string }) => toSchoolTypeColor(typeName),
        isPercent: true,
        isStack: true,
        label: {
            position: 'middle',
            content: function content(item) {
                return item.typeName
            },
            style: { fill: '#fff' },
        }
    }

    const config2 = {
        data,
        xField: 'year',
        yField: 'count',
        seriesField: 'typeName',
        colorField: 'typeName',
        color: ({ typeName }: { typeName: string }) => toSchoolTypeColor(typeName),
        isGroup: true,
        label: {
            position: 'top',
            content: (item) => {
                return `${item.typeName}: ${item.count}人`;
            },
            style: { fill: '#000' },
        },
        legend: {
            layout: 'vertical',
            position: 'right-top'
        },


    }

    return (
        <Row gutter={16}>
            <Col span={12}>
                <Column {...config1} />
            </Col>
            <Col span={12}>
                <Column {...config2} />
            </Col>
        </Row>
    )
}
