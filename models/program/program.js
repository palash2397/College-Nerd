import mongoose from 'mongoose';
;

const programSchma = new mongoose.Schema(
    {
        programName: {
            type: String,
            required: [true, 'program name is required'],
            maxlength: [50, 'Name cannot be more than 50 characters']
        },
      
    },
    {
        timestamps: true
    }
);


const Program = mongoose.model('Program', programSchma);
export default Program;
