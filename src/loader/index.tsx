const data = require('../database/db.json')
const schoolList = require('../database/school/schoolList.json')

export const getJson = () => {
    return data
}

export const getSchoolList = () => {
    return schoolList
}
