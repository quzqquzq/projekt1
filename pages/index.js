import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { getSupabase } from "../utils/supabase";
import Link from "next/link";
import {useEffect, useState} from "react";
// import material ui
import {Button, NativeSelect, styled, TextField, Typography} from "@mui/material";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


const CustomForm = styled('form')({

});

const CustomTextField = styled(TextField)({

});

const CustomPaperWelcome = styled(Paper)({
    display: 'flex',
    margin: '1rem',
    padding: '1rem',
});

const LogoutPaper = styled(Paper)({
    position: 'absolute',
    right: '1rem',
    marginRight: '2rem',
});

const CustomSubmitPaper = styled(Paper)({
    display: 'flex',
    margin: '1rem',
    padding: '1rem',
});

const TournamentPaper = styled(Paper)({
    padding: '1rem',
    marginBottom: '1rem',
});

const TournamentsWrapperUl = styled('ul')({
    listStyleType: 'none',
    padding: '1rem',
});

const MatchesPaper = styled(Paper)({
    padding: '1rem',
});

const CustomTeamScoresPaper = styled(Paper)({
});

const CustomVersusPaper = styled(Paper)({
    padding: '1rem',
});

const MatchesAndStandingsWrapper = styled(Paper)({
    display: 'flex',
    '& > *:last-child': {
        flex: 1,
    },
    '& > *:first-child': {
        // maxHeight: '50vh',
        overflow: 'auto',
    },
});

const TableContainerPaper = styled(TableContainer)({
    display: 'flex',
    flexDirection: 'column',
    marginTop: '3rem',
});

const TournamentStatsPaper = styled(Paper)({
    padding: '1rem',
    marginBottom: '1rem',
});

const DeletePublishPaper = styled(Paper)({
    display: 'flex',
    justifyContent: 'flex-end',
'& > *': {
        paddingRight: '1rem',
        marginLeft: '1rem',
    },

});

const CustomPaperTeams = styled(Paper)({
    marginTop: '1rem',
});

const Index = ({ user, tournaments, matches }) => {
    const [name, setName] = useState("");
    const [wins, setWins] = useState(0);
    const [losses, setLosses] = useState(0);
    const [draws, setDraws] = useState(0);
    const [numMatches, setNumMatches] = useState(4);
    const [teamNames, setTeamNames] = useState([]);

    const [allMatches, setMatches] = useState([...matches]);
    const [dictStandings, setDictStandings] = useState([]);


    const [allTournaments, setTournaments] = useState([...tournaments]);

    useEffect(() => {

    }, []);

    useEffect(() => {

    }, [allTournaments]);

    useEffect(() => {

    }, [user]);

    useEffect(() => {

    }, [allMatches]);

    useEffect(() => {
        const diff = numMatches - teamNames.length
        if (diff > 0) {
            let newPlayerNames = [...teamNames]
            for (let i = 0; i < diff; i++) {
                newPlayerNames.push("")
            }
            setTeamNames(newPlayerNames)
        } else if (diff < 0) {
            let newPlayerNames = [...teamNames]
            for (let i = 0; i < Math.abs(diff); i++) {
                newPlayerNames.pop()
            }
            setTeamNames(newPlayerNames)
        }
    }, [numMatches])

    const handleSubmit = async (e) => {
        e.preventDefault();

        const supabase = await getSupabase(user.accessToken);

        const uniqueNames = new Set(teamNames)
        if (uniqueNames.size !== teamNames.length) {
            alert("Team names must be unique!")
            return;
        }

        supabase
            .from("tournament")
            .insert({title: name, user_id: user.sub, wins: wins, losses: losses, draws: draws})
            .select().then(async data => {

            for (let i = 0; i < teamNames.length; i++) {
                for (let j = i + 1; j < teamNames.length; j++) {
                    supabase
                        .from("matches")
                        .insert({tournament_id: data.data[0].id, team_1: teamNames[i], team_2: teamNames[j]})
                        .select().then(data => {
                        setMatches(allMatches => [...allMatches, data.data[0]])
                    });
                }
            }

            const newTournaments = [...allTournaments, data.data[0]];
            setTournaments(newTournaments);

            const newStandings = await getStandings(data.data[0].id)
            setDictStandings({...dictStandings, [data.data[0].id]: newStandings})
        })


        setName("");
        setWins(0);
        setLosses(0);
        setDraws(0);
        setNumMatches(4);
        setTeamNames(["", "", "", ""]);

    };

    const handleDelete = async (id) => {
        const supabase = await getSupabase(user.accessToken);
        const { data } = await supabase
            .from("tournament")
            .delete()
            .match({ id: id });

        const newTournaments = allTournaments.filter((tournament) => {
            return tournament.id !== id;
        });

        setTournaments(newTournaments);
    }

    const handlePublish = async (id) => {
        const supabase = await getSupabase(user.accessToken);

        let { data, error } = await supabase
            .rpc('publish_tournament', {
                tournament_id: id,
            })

        if (error) console.error(error)
        else console.log("Published tournament successfully! with link");

        alert("API is there, but not implemented yet on frontend.")
    }

    const getStandings = async (tournamentId) => {
        const supabase = await getSupabase(user.accessToken);

        let { data, error } = await supabase
            .rpc('get_tournament_standings', {
                tid: tournamentId
            })

        if (error) console.error(error)
        else {
            //console.log("Got standings successfully!")
            //console.log(data);
            setDictStandings({...dictStandings, [tournamentId]: data})
            return data;
        }
    }

    const handleMatchScoreChange = async (match) => {
        const supabase = await getSupabase(user.accessToken);

        let { data, error } = await supabase
            .from('matches')
            .update({ team_1_score: match.team_1_score, team_2_score: match.team_2_score })
            .match({ id: match.id })

        setMatches([...allMatches])

        const newStandings = await getStandings(match.tournament_id)
        setDictStandings({...dictStandings, [match.tournament_id]: newStandings})

        if (error) console.error(error)
        else {

        }
    }

    return (
        <div>
            <CustomPaperWelcome elevation={3}>
                <Typography variant="h3">Welcome, {user.name}</Typography>
                <LogoutPaper elevation={0}>
                <Button
                    variant="contained"
                    color="secondary"
                    href="/api/auth/logout"
                >
                    Logout
                </Button>
                    </LogoutPaper>
            </CustomPaperWelcome>
            <CustomSubmitPaper>
            <CustomForm onSubmit={handleSubmit}>
                <CustomTextField sx={{ m: 1 }}
                    label="Name"
                    variant="outlined"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <CustomTextField sx={{ m: 1 }}
                    type="number"
                    label="Wins"
                    variant="outlined"
                    value={wins}
                    onChange={(e) => setWins(e.target.value)}
                />
                <CustomTextField sx={{ m: 1 }}
                    type="number"
                    label="Losses"
                    variant="outlined"
                    value={losses}
                    onChange={(e) => setLosses(e.target.value)}
                />
                <CustomTextField sx={{ m: 1 }}
                    type="number"
                    label="Draws"
                    variant="outlined"
                    value={draws}
                    onChange={(e) => setDraws(e.target.value)}
                />
                <NativeSelect sx={{ m: 1 }}
                    label="Number of Players"
                    variant="outlined"
                    value={numMatches}
                    onChange={(e) => setNumMatches(e.target.value)}
                >
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                    <option value={7}>7</option>
                    <option value={8}>8</option>
                </NativeSelect>
                <CustomPaperTeams elevation={0}>
                    {teamNames.map((playerName, index) => {
                            return (
                                <TextField sx={{ m: 1 }}
                                    key={index}
                                    label={`Team ${index + 1}`}
                                    variant="outlined"
                                    value={playerName}
                                    onChange={(e) => {
                                        let newPlayerNames = [...teamNames]
                                        newPlayerNames[index] = e.target.value
                                        setTeamNames(newPlayerNames)
                                    }}
                                />
                            )
                        }
                )}
                </CustomPaperTeams>
                <Button type="submit" variant="contained" color="primary" sx={{ m: 1 }}>
                    Submit
                </Button>
            </CustomForm>
            </CustomSubmitPaper>
            <TournamentsWrapperUl>
                {allTournaments.map((tournament) => {
                        return (
                            <TournamentPaper key={tournament.id}>
                                <TournamentStatsPaper elevation={0} sx={{ m: 1 }}>
                                <Typography variant="h4">{tournament.title}</Typography>
                                <Typography variant="h6">Wins: {tournament.wins} points</Typography>
                                <Typography variant="h6">Losses: {tournament.losses} points</Typography>
                                <Typography variant="h6">Draws: {tournament.draws} points</Typography>
                                </TournamentStatsPaper>
                                <DeletePublishPaper elevation={0}>
                                <Button sx={{ m: 1 }}
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => handleDelete(tournament.id)}
                                >
                                    Delete
                                </Button>
                                <Button sx={{ m: 1 }}
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handlePublish(tournament.id)}
                                >
                                    Publish
                                </Button>
                                </DeletePublishPaper>
                                <MatchesAndStandingsWrapper elevation={0}>
                                <MatchesPaper elevation={0}>
                                {Object.entries(allMatches).sort((a, b) => {
                                    if (a[1].team_1 === b[1].team_1) {
                                        return a[1].team_2 > b[1].team_2 ? 1 : -1
                                    }
                                    return a[1].team_1 > b[1].team_1 ? 1 : -1
                                }).map(([key, match]) => {
                                        if (match.tournament_id === tournament.id) {
                                            return (
                                                <CustomTeamScoresPaper key={match.id} elevation={0}>
                                                    <CustomVersusPaper elevation={0}>
                                                        <Typography variant="h6">{match.team_1} vs {match.team_2}</Typography>
                                                    </CustomVersusPaper>
                                                    <TextField sx={{ m: 1 }}
                                                        type="number"
                                                        label="Team 1 Score"
                                                        variant="outlined"
                                                        value={match.team_1_score}
                                                               // allow only numbers

                                                        onChange={(e) => {
                                                            let newMatches = [...allMatches]
                                                            newMatches.find(m => m.id === match.id).team_1_score = e.target.value
                                                            handleMatchScoreChange(match);
                                                        }}
                                                    />
                                                    <TextField sx={{ m: 1 }}
                                                        type="number"
                                                        label="Team 2 Score"
                                                        variant="outlined"
                                                        value={match.team_2_score}
                                                        onChange={(e) => {
                                                            let newMatches = [...allMatches]
                                                            newMatches.find(m => m.id === match.id).team_2_score = e.target.value
                                                            setMatches(newMatches)
                                                            handleMatchScoreChange(match);
                                                        }}
                                                    />
                                                </CustomTeamScoresPaper>
                                            )
                                        }
                                    }
                                )}
                                </MatchesPaper>
                                <TableContainerPaper component={Paper} elevation={0}>
                                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Team Name</TableCell>
                                                <TableCell align="right">Wins</TableCell>
                                                <TableCell align="right">Losses</TableCell>
                                                <TableCell align="right">Draws</TableCell>
                                                <TableCell align="right">Total Score</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dictStandings[tournament.id] && dictStandings[tournament.id].map((standing) => (
                                                <TableRow
                                                    key={standing.team_name}
                                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                >
                                                    <TableCell component="th" scope="row">
                                                        {standing.team}
                                                    </TableCell>
                                                    <TableCell align="right">{standing.wins}</TableCell>
                                                    <TableCell align="right">{standing.losses}</TableCell>
                                                    <TableCell align="right">{standing.draws}</TableCell>
                                                    <TableCell align="right">{standing.points}</TableCell>
                                                </TableRow>
                                            ))}

                                        </TableBody>
                                    </Table>
                                </TableContainerPaper>
                                </MatchesAndStandingsWrapper>
                            </TournamentPaper>
                        );
                    }
                )}
            </TournamentsWrapperUl>
        </div>
    );
}
export const getServerSideProps = withPageAuthRequired({
    async getServerSideProps({ req, res }) {
        const {
            user: { accessToken },
        } = await getSession(req, res);

        const supabase = await getSupabase(accessToken);

        const { data: tournaments } = await supabase.from("tournament").select("*");

        const { data: matches } = await supabase.from("matches").select("*");

        return {
            props: { tournaments, matches },
        };
    },
});

export default Index;
