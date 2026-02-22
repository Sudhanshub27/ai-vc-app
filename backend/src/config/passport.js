const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                const avatar = profile.photos?.[0]?.value || '';

                // Check if user exists by googleId
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    // Check if email already registered (link accounts)
                    user = await User.findOne({ email });
                    if (user) {
                        user.googleId = profile.id;
                        user.authProvider = 'google';
                        if (!user.avatar && avatar) user.avatar = avatar;
                        await user.save();
                    } else {
                        // Create brand new user
                        user = await User.create({
                            googleId: profile.id,
                            name: profile.displayName,
                            email,
                            avatar,
                            authProvider: 'google',
                            role: 'both',
                        });
                    }
                }

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

module.exports = passport;
