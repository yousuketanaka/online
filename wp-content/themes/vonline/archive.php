<?php load_template(TEMPLATEPATH . '/header-2.php'); ?>


<main>
    <div class="container">
        <div class="row">
            <div class="col-md-8">
               <section id="blog" class="blogArea">
                    <h2>ブログ</h2>
                    <div class="container">
                        <div class="row">
                            <?php if ( have_posts()): ?>
                            <div class="row">
                                <?php while ( have_posts() ) : the_post(); ?>
                                <div class="col-xs-12 col-sm-3 col-md-3">
                                    <a href="<?php the_permalink(); ?>">
                                     <?php if ( has_post_thumbnail() ) :
                                     the_post_thumbnail('post-thumbnails');
                                     else :
                                     echo '<img src="';
                                     bloginfo( 'template_url' );
                                     echo '/images/the_post_thumbnail_default.png" alt="デフォルト画像" />';
                                     endif; ?>
                                     </a>
                                </div>
                                <div class="col-xs-12 col-sm-9 col-md-9">
                                    <div class="list-group">
                                        <div class="list-group-item">
                                            <div class="row-picture">
                                                <a href="<?php the_permalink(); ?>">
                                                 <?php if ( has_post_thumbnail() ) :
                                                 the_post_thumbnail('post-thumbnails');
                                                 else :
                                                 echo '<img src="';
                                                 bloginfo( 'template_url' );
                                                 echo '/images/the_post_thumbnail_default.png" alt="デフォルト画像" />';
                                                 endif; ?>
                                                 </a>
                                            </div>
                                            <div class="row-content">
                                                <div class="list-group-item-heading">
                                                    <a href="#" title="sintret">
                                                        <small>sintret</small>
                                                    </a>
                                                </div>
                                                <small>
                                                    <i class="glyphicon glyphicon-time"></i><span>日付：<a href="<?php the_permalink(); ?>">
                                                    <time datetime="<?php the_time('y-m-d'); ?>"></time><?php the_time( get_option('date_format') ); ?></a></span>
                                                    <br>
                                                    <span class="explore"><i class="glyphicon glyphicon-th"></i> <a href="#">Explore 2 places </a></span>
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                    <h4><a href="<?php the_permalink(); ?>" title="<?php the_title_attribute(); ?>"><?php the_title(); ?></a></h4>
                                    <p><?php the_excerpt(); ?></p>
                                </div>
                                <?php endwhile; ?>
                            </div>
                            <hr>
                            <?php if(function_exists('wp_pagenavi')) { wp_pagenavi(); } ?>
                            <?php endif; ?>
                        </div>
                    </div>
                </section>
            </div>
            <div class="col-md-4">
                <?php get_sidebar(); ?>
            </div>
        </div>
    </div>
</main>

<?php get_footer(); ?>