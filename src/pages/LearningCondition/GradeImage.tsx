import React, { useState, useEffect } from 'react'
import { Select } from 'antd'
import { PieImage } from '@/components/PieImage'
import { useDataModel } from '@/dataModel'



export const GradeImage: React.FC<{
    selectYears: number[],
    setIsOpenPanel: any,
    curYear: number | undefined,
    setCurYear: React.Dispatch<React.SetStateAction<number | undefined>>
}> = ({ selectYears, setIsOpenPanel, curYear, setCurYear }) => {
    const { getStudentsByYear } = useDataModel()

    const options = selectYears.map((year) => {
        return {
            label: year,
            value: year
        }
    })

    return (
        <>
            <Select
                showSearch
                allowClear
                style={{ width: '100%', marginBottom: '10px' }}
                placeholder={'筛选年级'}
                options={options}
                value={curYear}
                onChange={(v) => {
                    if (!v)
                        setIsOpenPanel(false)
                    else {
                        setIsOpenPanel(true)
                    }
                    setCurYear(v)
                }}
            />
            <div
                style={{
                    height: 350,
                    overflowX: 'hidden',
                    overflowY: 'scroll',
                }}
            >
                {
                    curYear && <PieImage
                        students={getStudentsByYear(curYear)}
                        titleSpan={`${curYear}届`}
                    />
                }
            </div>
        </>
    )
}
