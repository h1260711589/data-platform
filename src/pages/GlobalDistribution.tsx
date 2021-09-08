import React from 'react'
import { Pie } from '@ant-design/charts';
import { useSchoolList } from '@/dataModel/useSchoolList'
import { useDataModel } from '@/dataModel/index'

export const GlobalDistribution = () => {
    const { getSchoolData, toSchoolTypeColor } = useSchoolList()
    const { students } = useDataModel()

    const schools = students.map((s) => {
        return s.college
    })

    const data = getSchoolData(schools)

    const config: any = {
        data,
        angleField: 'count',
        colorField: 'typeName',
        color: ({ typeName }: any) => {
            return toSchoolTypeColor(typeName)
        },
        appendPadding: 10,
        radius: 0.9,
        label: {
            type: 'inner',
            offset: '-30%',
            content: function content(_ref: any) {
                var percent = _ref.percent;
                return ''.concat((percent * 100).toFixed(0), '%');
            },
            style: {
                fontSize: 14,
                textAlign: 'center',
            },
        },
        interactions: [{ type: 'element-active' }]
    }

    return (
            <Pie  {...config} />
    )
}
