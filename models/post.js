module.exports = (sequelize,DataTypes) => (
    sequelize.define('post',{
        title: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        weather: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        img: {
            type : DataTypes.TEXT,
            allowNull: false
        },
        key: {
            type : DataTypes.TEXT,
            allowNull : false
        },
        date: {
            type : DataTypes.DATE,
            allowNull : true,
            defaultValue : sequelize.literal('now()')
        }
    },{
        timestamps: true,
        charset: 'utf8',
        collate: 'utf8_general_ci'
    })
);
