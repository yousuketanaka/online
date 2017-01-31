<?php
/*
Template Name: page2 
*/
?>

<?php load_template(TEMPLATEPATH . '/header-2.php'); ?>

 <main>
    <div class="container">
        <div class="row">
            <div class="col-md-10 col-md-offset-1">

            <?php while(have_posts()): the_post(); ?>
                <?php the_content(); ?>
            <?php endwhile; ?>
            
            </div>
        </div>
    </div>
</main>

<?php get_footer(); ?>