module.exports = (sequelize,DataTypes) => (
    sequelize.define('hashtag',{
        title: {
            type: DataTypes.STRING(30),
            allowNull: true,
            unique: true
        }
    },{
        timestamps: true,
        charset: 'utf8',
        collate: 'utf8_general_ci'
    })
);
