\c muse

INSERT INTO posts (user_id, song, artist, title, description) VALUES
(1, 'Dreamer', 'Ozzy Osbourne', 'My favorite Ozzy Osbourne song!', 'Wow! What a great song. What are your thoughts?'),
(1, 'Wish That You Were Mine', 'The Manhattans', 'Songs similar to this one?', 'I recently came across this song. It''s wonderful! Can someone recommend me similar songs?'),
(1, 'Strawberry Skies', 'Kid Travis', 'Upcoming artist Kid Travis', 'A new artist in the R&B scene! I''m excited for his upcoming work. Thoughts on his song Strawberry Skies?'),

(2, 'Mr. Telephone Man', 'New Edition', 'Original singer?', 'This song is so addicting! I hear that it''s a rendition of the original song. Who is the original singer?'),
(2, 'Remember the Rain', 'the sylvers', 'Anyone have the vinyl for this song?', 'I''m looking for the vinyl of this song. If anyone is selling, please put your Instagram handle in the comments!'),

(3, 'Moonlight Sonata', 'Ludwig van Beethoven', 'Timeless classic', 'Truly a timeless classic! I''m learning how to play this piece on the piano. My fingers cramp up every time! Any advice?'),
(3, 'Ave Maria', 'Franz Schubert', 'Full name for Ave Maria', 'For those who didn''t know, the full name for this piece is "Ellen''s Third Song, D. 839, Op. 52, No. 6." You learn something new everyday!'),
(3, 'Unstoppable', 'Daniel Caesar', 'New Daniel Caesar Album!', 'Daniel Caesar returns with his new album "Never Enough". Personally, I rate the song an 8/10. The songs captured his distinct vocal tones and had great sound textures. What are your thoughts? '),
(3, 'One Beer', 'MF DOOM', 'Favorite MF DOOM song?', 'MF DOOM is my favorite rapper of all time! "One Beer" has got to be his best song. Such cold, crisp verses. What are your favorite MF DOOM songs?'),
(3, 'Jody', 'Yamashita Tatsuro', 'Japanse City Pop!', 'Recently discovered Japanese City Pop! Yamashita is such a cool artist. A great find for my collection!');


INSERT INTO comments (user_id, post_id, comment) VALUES
(1, 4, 'In 1977, Meri Wilson released the song "Telephone Man". However, those two songs are completely different! They just have the same titles. Both are great songs, though. :)'),
(1, 5, 'Yes! I love this song. It''s so good! I wish more people knew about it. Unfortunately, I don''t have the vinyl for it. :('),
(1, 6, 'I suggest doing some warm ups before playing the piece! I get finger cramps too when playing the piano. Try it out!'),
(1, 1, 'By the way, Ozzy refers to this song as his version of John Lennon''s "Imagine". Which explains the similar melody!'),

(2, 1, 'Love the song! Ozzy is a master at blending his metal sounds into sentimental songs like Dreamer.'),
(2, 3, 'Never heard of Kid Travis, but I love this song! I''ll definitely check him out. Thanks for sharing!'),
(2, 5, 'Hey, I have the vinyl for this song! DM me on Instagram @ musicLover123. We''ll chat more there!'),
(2, 8, 'I''m going to have to give it a 7/10. While the songs were produced and mixed wonderfully, I just wish that he explored some other genres. They all have similar tones and characteristics as his previous songs! But overall, a solid album.'),

(3, 2, 'You have great taste, my friend! If you like The Manhattans I suggest listening to Marvin Gaye or Harold Melvin & The Blue Notes!'),
(3, 5, 'A hidden gem! My father would always play this song in his car radio. It''s a great song. The vinyl is hard to find these days!'),
(3, 1, 'Ozzy has evolved so much over the years. "Dreamer" is definitely up there on my list of favorite Ozzy songs. I loved his feature in Post Malone''s "Take What You Want". You should check it out!'),
(3, 9, 'MF DOOM is aweeesomeee! For me, I think "Next Levels" is my favorite song. It has a classic boom-bap beat and DOOM''s lyrics fit perfectly.');